import { buildGraphData, getRecentPosts } from '$lib/data/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const recentPosts = getRecentPosts(6);
	const graph = buildGraphData();

	return {
		recentPosts,
		graph
	};
};
