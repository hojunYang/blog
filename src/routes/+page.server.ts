import { getRecentPosts } from '$lib/data/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const recentPosts = getRecentPosts(5);

	return {
		recentPosts
	};
};

