import { getAllPostsMetadata } from '$lib/data/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const posts = getAllPostsMetadata();

	return {
		posts
	};
};

