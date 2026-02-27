import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import type { BlogPost, GraphData, GraphLink, GraphNode, GraphStats } from '$lib/types';

const postsDirectory = join(process.cwd(), 'static', 'posts');

// marked 설정
marked.setOptions({
	breaks: true,
	gfm: true
});

// 이미지 렌더러 커스터마이징 (가로폭 제한 및 비율 유지)
const renderer = new Renderer();
renderer.image = ({ href, title, text }) => {
	const titleAttr = title ? ` title="${title}"` : '';
	return `<img src="${href}" alt="${text}"${titleAttr} style="max-width: 100%; height: auto; display: block; margin: 1rem auto;">`;
};

marked.use({ renderer });

// marked에 highlight.js 확장 추가
marked.use(
	markedHighlight({
		langPrefix: 'hljs language-',
		highlight(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	})
);

type ParsedPost = {
	id: string;
	title: string;
	excerpt: string;
	date: string;
	author: string;
	tags: string[];
	refs: string[];
	content: string;
	filename: string;
};

type WikiLink = {
	targetId: string;
	alias?: string;
};

const WIKI_LINK_PATTERN = /\[\[([^[\]]+?)\]\]/g;

function parseWikiToken(rawToken: string): WikiLink | null {
	const [targetPart, ...aliasParts] = rawToken.split('|');
	const targetId = targetPart?.trim() ?? '';
	if (!targetId) {
		return null;
	}

	const aliasRaw = aliasParts.join('|').trim();
	return {
		targetId,
		alias: aliasRaw.length > 0 ? aliasRaw : undefined
	};
}

function extractWikiLinks(content: string): WikiLink[] {
	const links: WikiLink[] = [];
	const regex = new RegExp(WIKI_LINK_PATTERN);
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		const parsed = parseWikiToken(match[1]);
		if (!parsed) continue;
		links.push(parsed);
	}
	return links;
}

function parseRefsFromContent(content: string): string[] {
	return Array.from(new Set(extractWikiLinks(content).map((link) => link.targetId)));
}

function escapeMarkdownLinkText(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/\]/g, '\\]');
}

function convertWikiLinksToMarkdown(content: string, validPostIds: Set<string>): string {
	const regex = new RegExp(WIKI_LINK_PATTERN);
	return content.replace(regex, (_full, rawToken: string) => {
		const parsed = parseWikiToken(rawToken);
		if (!parsed) {
			return rawToken.trim();
		}

		const plainText = parsed.alias ?? parsed.targetId;
		if (!validPostIds.has(parsed.targetId)) {
			return plainText;
		}

		const href = `/post/${encodeURIComponent(parsed.targetId)}`;
		return `[${escapeMarkdownLinkText(plainText)}](${href})`;
	});
}

function readAllPosts(): { posts: ParsedPost[]; skipped: string[] } {
	const fileNames = readdirSync(postsDirectory);
	const skipped: string[] = [];
	const posts: ParsedPost[] = [];

	fileNames
		.filter((fileName) => fileName.endsWith('.md'))
		.forEach((fileName) => {
			try {
				const fullPath = join(postsDirectory, fileName);
				const fileContents = readFileSync(fullPath, 'utf8');
				const { data, content } = matter(fileContents);

				if (!data?.id || !data?.title || !data?.date) {
					skipped.push(fileName);
					return;
				}

				const tags = Array.isArray(data.tags) ? data.tags : [];
				const refs = parseRefsFromContent(content);

				posts.push({
					id: data.id,
					title: data.title,
					excerpt: data.excerpt ?? '',
					date: data.date,
					author: data.author ?? '',
					tags,
					refs,
					content,
					filename: fileName
				});
			} catch (e) {
				skipped.push(fileName);
			}
		});

	return { posts, skipped };
}

// 모든 포스트 메타데이터 가져오기
export function getAllPostsMetadata(): Omit<BlogPost, 'content'>[] {
	const { posts } = readAllPosts();

	return posts
		.map((p) => ({
			id: p.id,
			title: p.title,
			excerpt: p.excerpt,
			date: p.date,
			author: p.author,
			tags: p.tags
		}))
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 그래프 데이터 생성: 포스트/태그 노드 + 내부링크(ref)/포스트-태그 엣지
export function buildGraphData(): GraphData {
	const { posts, skipped } = readAllPosts();
	const tagSet = new Set<string>();
	posts.forEach((p) => p.tags.forEach((tag) => tagSet.add(tag)));

	const nodes: GraphNode[] = [
		...posts.map((p) => ({
			id: `post:${p.id}`,
			type: 'post' as const,
			label: p.title,
			tags: p.tags,
			slug: p.id,
			date: p.date,
			author: p.author,
			excerpt: p.excerpt,
			weight: Math.max(1, p.refs.length || 1),
			score: 0
		})),
		...Array.from(tagSet).map((tag) => ({
			id: `tag:${tag}`,
			type: 'tag' as const,
			label: tag,
			weight: 1,
			score: 0
		}))
	];

	const links: GraphLink[] = [];

	// ref edges (본문 [[id]] / [[id|alias]])
	const postIdSet = new Set(posts.map((p) => p.id));
	posts.forEach((p) => {
		p.refs.forEach((refId) => {
			if (postIdSet.has(refId) && refId !== p.id) {
				links.push({
					type: 'ref',
					source: `post:${p.id}`,
					target: `post:${refId}`,
					weight: 1
				});
			}
		});
	});

	// post-tag edges (태그를 노드로 표시하기 위한 연결)
	posts.forEach((p) => {
		p.tags.forEach((tag) => {
			links.push({
				type: 'post-tag',
				source: `post:${p.id}`,
				target: `tag:${tag}`,
				weight: 1
			});
		});
	});

	// score 계산 (post만): 글-글(ref) 연결만 반영
	const scoreMap = new Map<string, number>();
	const bump = (id: string, w: number) => {
		if (!id.startsWith('post:')) return;
		scoreMap.set(id, (scoreMap.get(id) ?? 0) + w);
	};

	links
		.filter((l) => l.type === 'ref')
		.forEach((l) => {
		const w = l.weight ?? 1;
		const src = typeof l.source === 'string' ? l.source : l.source.id;
		const tgt = typeof l.target === 'string' ? l.target : l.target.id;
		bump(src, w);
		bump(tgt, w);
		});

	nodes.forEach((n) => {
		if (n.type === 'post') {
			n.score = scoreMap.get(n.id) ?? 0;
		}
	});

	const stats: GraphStats = {
		totalPosts: posts.length,
		totalTags: tagSet.size,
		refEdges: links.filter((l) => l.type === 'ref').length,
		sharedTagEdges: 0,
		postTagEdges: links.filter((l) => l.type === 'post-tag').length,
		skippedFiles: skipped
	};

	return { nodes, links, stats };
}

// 특정 포스트의 전체 내용 가져오기 (메타데이터 + HTML 컨텐츠)
export async function getPostById(id: string): Promise<BlogPost | null> {
	try {
		const fullPath = join(postsDirectory, `${id}.md`);
		const fileContents = readFileSync(fullPath, 'utf8');
		const { data, content } = matter(fileContents);
		const validPostIds = new Set(readAllPosts().posts.map((post) => post.id));
		const normalizedMarkdown = convertWikiLinksToMarkdown(content, validPostIds);

		// 마크다운을 HTML로 변환 (Obsidian식 내부링크 [[...]] 지원)
		const htmlContent = await marked(normalizedMarkdown);

		return {
			id: data.id,
			title: data.title,
			excerpt: data.excerpt ?? '',
			date: data.date,
			author: data.author ?? '',
			tags: Array.isArray(data.tags) ? data.tags : [],
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
