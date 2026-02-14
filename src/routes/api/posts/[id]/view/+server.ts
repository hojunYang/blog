import { error, json, type RequestHandler } from '@sveltejs/kit';
import { getPostMetadata } from '$lib/data/posts';
import { ensureSameOrigin, recordViewForEvent } from '$lib/server/metrics';

export const POST: RequestHandler = async (event) => {
	ensureSameOrigin(event);

	const postId = event.params.id;
	if (!postId) {
		throw error(400, '잘못된 포스트 ID입니다');
	}

	const post = getPostMetadata(postId);
	if (!post) {
		throw error(404, '포스트를 찾을 수 없습니다');
	}

	const result = await recordViewForEvent(event, postId);
	return json(result);
};
