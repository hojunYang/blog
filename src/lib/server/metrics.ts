import { createHmac, randomUUID } from 'node:crypto';
import { error, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { withClient, getPool } from '$lib/server/db';
import type { MetricEventResult, PostMetrics } from '$lib/types';

const VISITOR_COOKIE_NAME = 'visitor_id';
const VIEW_WINDOW_HOURS = 24;

function getHashSecret(): string {
	return env.VISITOR_HASH_SECRET || 'dev-only-secret';
}

function hashValue(value: string): string {
	return createHmac('sha256', getHashSecret()).update(value).digest('hex');
}

function getClientIp(event: RequestEvent): string {
	const forwarded = event.request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}

	const realIp = event.request.headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}

	try {
		return event.getClientAddress();
	} catch {
		return '0.0.0.0';
	}
}

export function ensureSameOrigin(event: RequestEvent): void {
	const origin = event.request.headers.get('origin');
	if (!origin) return;
	if (origin !== event.url.origin) {
		throw error(403, 'Invalid origin');
	}
}

export function ensureVisitorIdCookie(event: RequestEvent): string {
	let visitorId = event.cookies.get(VISITOR_COOKIE_NAME);
	if (!visitorId) {
		visitorId = randomUUID();
		event.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 365
		});
	}
	return visitorId;
}

export function computeFingerprint(event: RequestEvent): string {
	const visitorId = ensureVisitorIdCookie(event);
	const ipHash = hashValue(getClientIp(event));
	return hashValue(`${visitorId}:${ipHash}`);
}

function emptyMetrics(postId: string): PostMetrics {
	return {
		postId,
		likes: 0,
		views: 0,
		likedByMe: false
	};
}

async function getMetricsByFingerprint(postId: string, fingerprint: string): Promise<PostMetrics> {
	if (!getPool()) {
		return emptyMetrics(postId);
	}

	return withClient(async (client) => {
		const metricsRes = await client.query<{
			likes_count: number;
			views_count: number;
		}>('SELECT likes_count, views_count FROM post_metrics WHERE post_id = $1', [postId]);

		const likeRes = await client.query('SELECT 1 FROM post_likes WHERE post_id = $1 AND fingerprint = $2 LIMIT 1', [
			postId,
			fingerprint
		]);

		const metricsRow = metricsRes.rows[0];
		return {
			postId,
			likes: Number(metricsRow?.likes_count ?? 0),
			views: Number(metricsRow?.views_count ?? 0),
			likedByMe: (likeRes.rowCount ?? 0) > 0
		};
	});
}

export async function getMetricsForEvent(event: RequestEvent, postId: string): Promise<PostMetrics> {
	const fingerprint = computeFingerprint(event);
	try {
		return await getMetricsByFingerprint(postId, fingerprint);
	} catch {
		return emptyMetrics(postId);
	}
}

export async function recordLikeForEvent(event: RequestEvent, postId: string): Promise<MetricEventResult> {
	const fingerprint = computeFingerprint(event);

	if (!getPool()) {
		return {
			counted: false,
			metrics: emptyMetrics(postId)
		};
	}

	try {
		const counted = await withClient(async (client) => {
			await client.query('BEGIN');
			try {
				await client.query(
					'INSERT INTO post_metrics (post_id, likes_count, views_count) VALUES ($1, 0, 0) ON CONFLICT (post_id) DO NOTHING',
					[postId]
				);

				// toggle like:
				// 1) liked -> unlike (delete + decrement)
				// 2) not liked -> like (insert + increment)
				const deleted = await client.query(
					'DELETE FROM post_likes WHERE post_id = $1 AND fingerprint = $2',
					[postId, fingerprint]
				);

				let shouldCount = false;
				if ((deleted.rowCount ?? 0) > 0) {
					await client.query(
						'UPDATE post_metrics SET likes_count = GREATEST(likes_count - 1, 0), updated_at = now() WHERE post_id = $1',
						[postId]
					);
					shouldCount = true;
				} else {
					const inserted = await client.query(
						'INSERT INTO post_likes (post_id, fingerprint) VALUES ($1, $2) ON CONFLICT (post_id, fingerprint) DO NOTHING',
						[postId, fingerprint]
					);
					if ((inserted.rowCount ?? 0) > 0) {
						await client.query(
							'UPDATE post_metrics SET likes_count = likes_count + 1, updated_at = now() WHERE post_id = $1',
							[postId]
						);
						shouldCount = true;
					}
				}

				await client.query('COMMIT');
				return shouldCount;
			} catch (e) {
				await client.query('ROLLBACK');
				throw e;
			}
		});

		const metrics = await getMetricsByFingerprint(postId, fingerprint);
		return { counted, metrics };
	} catch {
		return {
			counted: false,
			metrics: emptyMetrics(postId)
		};
	}
}

export async function recordViewForEvent(event: RequestEvent, postId: string): Promise<MetricEventResult> {
	const fingerprint = computeFingerprint(event);

	if (!getPool()) {
		return {
			counted: false,
			metrics: emptyMetrics(postId)
		};
	}

	try {
		const counted = await withClient(async (client) => {
			await client.query('BEGIN');
			try {
				await client.query(
					'INSERT INTO post_metrics (post_id, likes_count, views_count) VALUES ($1, 0, 0) ON CONFLICT (post_id) DO NOTHING',
					[postId]
				);

				const windowRes = await client.query(
					`INSERT INTO post_view_windows (post_id, fingerprint, last_viewed_at)
					 VALUES ($1, $2, now())
					 ON CONFLICT (post_id, fingerprint)
					 DO UPDATE SET last_viewed_at = EXCLUDED.last_viewed_at
					 WHERE post_view_windows.last_viewed_at < now() - interval '${VIEW_WINDOW_HOURS} hours'
					 RETURNING 1`,
					[postId, fingerprint]
				);

				const shouldCount = (windowRes.rowCount ?? 0) > 0;
				if (shouldCount) {
					await client.query(
						'UPDATE post_metrics SET views_count = views_count + 1, updated_at = now() WHERE post_id = $1',
						[postId]
					);
				}

				await client.query('COMMIT');
				return shouldCount;
			} catch (e) {
				await client.query('ROLLBACK');
				throw e;
			}
		});

		const metrics = await getMetricsByFingerprint(postId, fingerprint);
		return {
			counted,
			metrics: {
				...metrics,
				viewCountedThisRequest: counted
			}
		};
	} catch {
		return {
			counted: false,
			metrics: emptyMetrics(postId)
		};
	}
}
