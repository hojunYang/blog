import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import type { BlogPost } from '$lib/types';

const postsDirectory = join(process.cwd(), 'src', 'lib', 'posts');

// 모든 포스트 메타데이터 가져오기
export function getAllPostsMetadata(): Omit<BlogPost, 'content'>[] {
	const fileNames = readdirSync(postsDirectory);
	const posts = fileNames
		.filter((fileName: string) => fileName.endsWith('.md'))
		.map((fileName: string) => {
			const fullPath = join(postsDirectory, fileName);
			const fileContents = readFileSync(fullPath, 'utf8');
			const { data } = matter(fileContents);

			return {
				id: data.id,
				title: data.title,
				excerpt: data.excerpt,
				date: data.date,
				author: data.author,
				tags: data.tags
			} as Omit<BlogPost, 'content'>;
		});

	// 날짜순 정렬 (최신순)
	return posts.sort(
		(a: Omit<BlogPost, 'content'>, b: Omit<BlogPost, 'content'>) =>
			new Date(b.date).getTime() - new Date(a.date).getTime()
	);
}

// 특정 포스트의 전체 내용 가져오기 (메타데이터 + HTML 컨텐츠)
export async function getPostById(id: string): Promise<BlogPost | null> {
	try {
		const fullPath = join(postsDirectory, `${id}.md`);
		const fileContents = readFileSync(fullPath, 'utf8');
		const { data, content } = matter(fileContents);

		// 마크다운을 HTML로 변환
		const htmlContent = await marked(content);

		return {
			id: data.id,
			title: data.title,
			excerpt: data.excerpt,
			date: data.date,
			author: data.author,
			tags: data.tags,
			content: htmlContent
		} as BlogPost;
	} catch (error) {
		console.error(`포스트를 찾을 수 없습니다: ${id}`, error);
		return null;
	}
}

// 특정 포스트의 메타데이터만 가져오기
export function getPostMetadata(id: string): Omit<BlogPost, 'content'> | null {
	try {
		const fullPath = join(postsDirectory, `${id}.md`);
		const fileContents = readFileSync(fullPath, 'utf8');
		const { data } = matter(fileContents);

		return {
			id: data.id,
			title: data.title,
			excerpt: data.excerpt,
			date: data.date,
			author: data.author,
			tags: data.tags
		} as Omit<BlogPost, 'content'>;
	} catch (error) {
		console.error(`포스트를 찾을 수 없습니다: ${id}`, error);
		return null;
	}
}

// 최근 포스트 가져오기
export function getRecentPosts(limit: number = 5): Omit<BlogPost, 'content'>[] {
	const allPosts = getAllPostsMetadata();
	return allPosts.slice(0, limit);
}
