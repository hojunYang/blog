import { getPool, withClient } from '$lib/server/db';
import type { PostComment } from '$lib/types';

const AUTHOR_NAME_MAX_LENGTH = 40;
const CONTENT_MAX_LENGTH = 5000;
const PASSWORD_MAX_LENGTH = 128;

type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

type CommentRow = {
	id: number | string;
	post_id: string;
	author_name: string;
	content: string;
	created_at: Date | string;
	updated_at: Date | string;
};

type CreateCommentInput = {
	authorName: string;
	password: string;
	content: string;
};

type UpdateCommentInput = {
	password: string;
	content: string;
};

type DeleteCommentInput = {
	password: string;
};

export type CreateCommentResult =
	| { status: 'created'; comment: PostComment }
	| { status: 'invalid_input'; message: string }
	| { status: 'db_unavailable' }
	| { status: 'failed' };

export type UpdateCommentResult =
	| { status: 'updated'; comment: PostComment }
	| { status: 'invalid_input'; message: string }
	| { status: 'invalid_password' }
	| { status: 'not_found' }
	| { status: 'db_unavailable' }
	| { status: 'failed' };

export type DeleteCommentResult =
	| { status: 'deleted' }
	| { status: 'invalid_input'; message: string }
	| { status: 'invalid_password' }
	| { status: 'not_found' }
	| { status: 'db_unavailable' }
	| { status: 'failed' };

function toIsoString(value: Date | string): string {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return new Date(0).toISOString();
	}
	return date.toISOString();
}

function mapCommentRow(row: CommentRow): PostComment {
	return {
		id: Number(row.id),
		postId: row.post_id,
		authorName: row.author_name,
		content: row.content,
		createdAt: toIsoString(row.created_at),
		updatedAt: toIsoString(row.updated_at)
	};
}

function validateTextField(
	value: unknown,
	label: string,
	options: {
		maxLength: number;
		trim: boolean;
	}
): ValidationResult<string> {
	if (typeof value !== 'string') {
		return { ok: false, message: `${label}은(는) 문자열이어야 합니다` };
	}

	const normalized = options.trim ? value.trim() : value;
	const emptyCheckValue = options.trim ? normalized : value.trim();
	if (emptyCheckValue.length === 0) {
		return { ok: false, message: `${label}을(를) 입력해주세요` };
	}

	if (normalized.length > options.maxLength) {
		return { ok: false, message: `${label}은(는) ${options.maxLength}자 이하여야 합니다` };
	}

	return { ok: true, value: normalized };
}

function validateCreateInput(raw: unknown): ValidationResult<CreateCommentInput> {
	if (!raw || typeof raw !== 'object') {
		return { ok: false, message: '요청 본문이 올바르지 않습니다' };
	}

	const payload = raw as Record<string, unknown>;
	const authorName = validateTextField(payload.authorName, '이름', {
		maxLength: AUTHOR_NAME_MAX_LENGTH,
		trim: true
	});
	if (!authorName.ok) return authorName;

	const password = validateTextField(payload.password, '비밀번호', {
		maxLength: PASSWORD_MAX_LENGTH,
		trim: false
	});
	if (!password.ok) return password;

	const content = validateTextField(payload.content, '댓글', {
		maxLength: CONTENT_MAX_LENGTH,
		trim: true
	});
	if (!content.ok) return content;

	return {
		ok: true,
		value: {
			authorName: authorName.value,
			password: password.value,
			content: content.value
		}
	};
}

function validateUpdateInput(raw: unknown): ValidationResult<UpdateCommentInput> {
	if (!raw || typeof raw !== 'object') {
		return { ok: false, message: '요청 본문이 올바르지 않습니다' };
	}

	const payload = raw as Record<string, unknown>;
	const password = validateTextField(payload.password, '비밀번호', {
		maxLength: PASSWORD_MAX_LENGTH,
		trim: false
	});
	if (!password.ok) return password;

	const content = validateTextField(payload.content, '댓글', {
		maxLength: CONTENT_MAX_LENGTH,
		trim: true
	});
	if (!content.ok) return content;

	return {
		ok: true,
		value: {
			password: password.value,
			content: content.value
		}
	};
}

function validateDeleteInput(raw: unknown): ValidationResult<DeleteCommentInput> {
	if (!raw || typeof raw !== 'object') {
		return { ok: false, message: '요청 본문이 올바르지 않습니다' };
	}

	const payload = raw as Record<string, unknown>;
	const password = validateTextField(payload.password, '비밀번호', {
		maxLength: PASSWORD_MAX_LENGTH,
		trim: false
	});
	if (!password.ok) return password;

	return {
		ok: true,
		value: {
			password: password.value
		}
	};
}

function isValidCommentId(commentId: number): boolean {
	return Number.isInteger(commentId) && commentId > 0;
}

async function hasActiveComment(postId: string, commentId: number): Promise<boolean> {
	return withClient(async (client) => {
		const exists = await client.query(
			`SELECT 1
			 FROM post_comments
			 WHERE id = $1
			   AND post_id = $2
			   AND deleted_at IS NULL
			 LIMIT 1`,
			[commentId, postId]
		);
		return (exists.rowCount ?? 0) > 0;
	});
}

export async function getCommentsForPost(postId: string): Promise<PostComment[]> {
	if (!getPool()) {
		return [];
	}

	try {
		return await withClient(async (client) => {
			const res = await client.query<CommentRow>(
				`SELECT id, post_id, author_name, content, created_at, updated_at
				 FROM post_comments
				 WHERE post_id = $1
				   AND deleted_at IS NULL
				 ORDER BY created_at DESC, id DESC`,
				[postId]
			);

			return res.rows.map(mapCommentRow);
		});
	} catch {
		return [];
	}
}

export async function createCommentForPost(postId: string, raw: unknown): Promise<CreateCommentResult> {
	const input = validateCreateInput(raw);
	if (!input.ok) {
		return {
			status: 'invalid_input',
			message: input.message
		};
	}

	if (!getPool()) {
		return { status: 'db_unavailable' };
	}

	try {
		const row = await withClient(async (client) => {
			const res = await client.query<CommentRow>(
				`INSERT INTO post_comments (post_id, author_name, password_hash, content)
				 VALUES ($1, $2, crypt($3, gen_salt('bf', 12)), $4)
				 RETURNING id, post_id, author_name, content, created_at, updated_at`,
				[postId, input.value.authorName, input.value.password, input.value.content]
			);
			return res.rows[0];
		});

		if (!row) {
			return { status: 'failed' };
		}

		return {
			status: 'created',
			comment: mapCommentRow(row)
		};
	} catch {
		return { status: 'failed' };
	}
}

export async function updateCommentForPost(postId: string, commentId: number, raw: unknown): Promise<UpdateCommentResult> {
	if (!isValidCommentId(commentId)) {
		return {
			status: 'invalid_input',
			message: '잘못된 댓글 ID입니다'
		};
	}

	const input = validateUpdateInput(raw);
	if (!input.ok) {
		return {
			status: 'invalid_input',
			message: input.message
		};
	}

	if (!getPool()) {
		return { status: 'db_unavailable' };
	}

	try {
		const row = await withClient(async (client) => {
			const res = await client.query<CommentRow>(
				`UPDATE post_comments
				 SET content = $3,
					 updated_at = NOW()
				 WHERE id = $1
				   AND post_id = $2
				   AND deleted_at IS NULL
				   AND password_hash = crypt($4, password_hash)
				 RETURNING id, post_id, author_name, content, created_at, updated_at`,
				[commentId, postId, input.value.content, input.value.password]
			);
			return res.rows[0];
		});

		if (row) {
			return {
				status: 'updated',
				comment: mapCommentRow(row)
			};
		}

		const exists = await hasActiveComment(postId, commentId);
		return { status: exists ? 'invalid_password' : 'not_found' };
	} catch {
		return { status: 'failed' };
	}
}

export async function deleteCommentForPost(postId: string, commentId: number, raw: unknown): Promise<DeleteCommentResult> {
	if (!isValidCommentId(commentId)) {
		return {
			status: 'invalid_input',
			message: '잘못된 댓글 ID입니다'
		};
	}

	const input = validateDeleteInput(raw);
	if (!input.ok) {
		return {
			status: 'invalid_input',
			message: input.message
		};
	}

	if (!getPool()) {
		return { status: 'db_unavailable' };
	}

	try {
		const deleted = await withClient(async (client) => {
			const res = await client.query(
				`UPDATE post_comments
				 SET deleted_at = NOW(),
					 updated_at = NOW()
				 WHERE id = $1
				   AND post_id = $2
				   AND deleted_at IS NULL
				   AND password_hash = crypt($3, password_hash)
				 RETURNING id`,
				[commentId, postId, input.value.password]
			);
			return (res.rowCount ?? 0) > 0;
		});

		if (deleted) {
			return { status: 'deleted' };
		}

		const exists = await hasActiveComment(postId, commentId);
		return { status: exists ? 'invalid_password' : 'not_found' };
	} catch {
		return { status: 'failed' };
	}
}
