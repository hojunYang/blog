import { error } from '@sveltejs/kit';
import { getPostById } from '$lib/data/posts';
import { getCommentsForPost } from '$lib/server/comments';
import { getMetricsForEvent } from '$lib/server/metrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { params } = event;
	const post = await getPostById(params.id);

	if (!post) {
		throw error(404, '포스트를 찾을 수 없습니다');
	}

	const [metrics, comments] = await Promise.all([
		getMetricsForEvent(event, params.id),
		getCommentsForPost(params.id)
	]);

	return {
		post,
		metrics,
		comments
	};
};
