import { error, fail } from '@sveltejs/kit';
import { getPostById, getPostMetadata, isSecretPost, verifyPostPassword } from '$lib/server/posts';
import { getCommentsForPost } from '$lib/server/comments';
import { ensureSameOrigin, getMetricsForEvent } from '$lib/server/metrics';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { params } = event;
	const postMetadata = getPostMetadata(params.id);

	if (!postMetadata) {
		throw error(404, '포스트를 찾을 수 없습니다');
	}

	if (isSecretPost(params.id)) {
		return {
			locked: true
		};
	}

	const post = await getPostById(params.id);

	if (!post) {
		throw error(404, '포스트를 찾을 수 없습니다');
	}

	const [metrics, comments] = await Promise.all([
		getMetricsForEvent(event, params.id),
		getCommentsForPost(params.id)
	]);

	return {
		locked: false,
		post,
		metrics,
		comments
	};
};

export const actions: Actions = {
	unlock: async (event) => {
		ensureSameOrigin(event);

		const postId = event.params.id;
		if (!postId || !getPostMetadata(postId)) {
			throw error(404, '포스트를 찾을 수 없습니다');
		}

		if (!isSecretPost(postId)) {
			throw error(400, '비밀글이 아닙니다');
		}

		const formData = await event.request.formData();
		const password = String(formData.get('password') ?? '');

		if (!verifyPostPassword(postId, password)) {
			return fail(403, {
				locked: true,
				unlockError: '비밀번호가 올바르지 않습니다'
			});
		}

		const post = await getPostById(postId, { includeSecret: true });
		if (!post) {
			throw error(404, '포스트를 찾을 수 없습니다');
		}

		const [metrics, comments] = await Promise.all([
			getMetricsForEvent(event, postId),
			getCommentsForPost(postId)
		]);

		return {
			locked: false,
			post,
			metrics,
			comments
		};
	}
};
