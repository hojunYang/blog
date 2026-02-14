import { error, json, type RequestHandler } from '@sveltejs/kit';
import { getPostMetadata } from '$lib/data/posts';
import { deleteCommentForPost, updateCommentForPost } from '$lib/server/comments';
import { ensureSameOrigin } from '$lib/server/metrics';

function ensurePostExists(postId: string): void {
	const post = getPostMetadata(postId);
	if (!post) {
		throw error(404, '포스트를 찾을 수 없습니다');
	}
}

function parseCommentId(rawCommentId: string | undefined): number {
	const commentId = Number(rawCommentId);
	if (!Number.isInteger(commentId) || commentId <= 0) {
		throw error(400, '잘못된 댓글 ID입니다');
	}
	return commentId;
}

export const PATCH: RequestHandler = async (event) => {
	ensureSameOrigin(event);

	const postId = event.params.id;
	if (!postId) {
		throw error(400, '잘못된 포스트 ID입니다');
	}
	ensurePostExists(postId);

	const commentId = parseCommentId(event.params.commentId);

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		throw error(400, '요청 본문이 올바른 JSON 형식이 아닙니다');
	}

	const result = await updateCommentForPost(postId, commentId, body);
	if (result.status === 'invalid_input') {
		throw error(400, result.message);
	}
	if (result.status === 'invalid_password') {
		throw error(403, '비밀번호가 올바르지 않습니다');
	}
	if (result.status === 'not_found') {
		throw error(404, '댓글을 찾을 수 없습니다');
	}
	if (result.status === 'db_unavailable') {
		throw error(503, 'DATABASE_URL이 설정되지 않았습니다');
	}
	if (result.status === 'failed') {
		throw error(500, '댓글 수정 중 오류가 발생했습니다');
	}

	return json({ comment: result.comment });
};

export const DELETE: RequestHandler = async (event) => {
	ensureSameOrigin(event);

	const postId = event.params.id;
	if (!postId) {
		throw error(400, '잘못된 포스트 ID입니다');
	}
	ensurePostExists(postId);

	const commentId = parseCommentId(event.params.commentId);

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		throw error(400, '요청 본문이 올바른 JSON 형식이 아닙니다');
	}

	const result = await deleteCommentForPost(postId, commentId, body);
	if (result.status === 'invalid_input') {
		throw error(400, result.message);
	}
	if (result.status === 'invalid_password') {
		throw error(403, '비밀번호가 올바르지 않습니다');
	}
	if (result.status === 'not_found') {
		throw error(404, '댓글을 찾을 수 없습니다');
	}
	if (result.status === 'db_unavailable') {
		throw error(503, 'DATABASE_URL이 설정되지 않았습니다');
	}
	if (result.status === 'failed') {
		throw error(500, '댓글 삭제 중 오류가 발생했습니다');
	}

	return json({ deleted: true });
};
