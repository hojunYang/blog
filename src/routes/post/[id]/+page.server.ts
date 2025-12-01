import { error } from '@sveltejs/kit';
import { getPostById } from '$lib/data/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPostById(params.id);
	
	if (!post) {
		throw error(404, '포스트를 찾을 수 없습니다');
	}

	return {
		post
	};
};

