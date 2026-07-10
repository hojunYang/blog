import { timingSafeEqual } from 'node:crypto';
import matter from 'gray-matter';
import { Marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import katex from 'katex';
import type { BlogPost, GraphData, GraphLink, GraphNode, GraphStats } from '$lib/types';
import type { MarkedExtension, Token, TokenizerAndRendererExtension, Tokens } from 'marked';

const postFiles = import.meta.glob('./content/posts/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const MARKED_OPTIONS = {
	breaks: true,
	gfm: true
} as const;

const TOC_MARKER_PATTERN = /<!--\s*toc\s*-->/gi;
const HAS_TOC_MARKER_PATTERN = /<!--\s*toc\s*-->/i;
const MIN_TOC_DEPTH = 2;
const MAX_TOC_DEPTH = 4;

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
	secret: boolean;
	password: string;
};

type WikiLink = {
	targetId: string;
	alias?: string;
};

type TocItem = {
	id: string;
	text: string;
	depth: number;
};

type MathToken = Tokens.Generic & {
	text: string;
	displayMode: boolean;
};

const WIKI_LINK_PATTERN = /\[\[([^[\]]+?)\]\]/g;

function normalizeString(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	if (typeof value === 'string') {
		return value;
	}
	if (value === null || value === undefined) {
		return '';
	}
	return String(value);
}

function normalizeTags(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map((tag) => normalizeString(tag)).filter(Boolean);
}

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

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function renderMathExpression(expression: string, displayMode: boolean): string {
	try {
		return katex.renderToString(expression, {
			displayMode,
			throwOnError: false,
			output: 'htmlAndMathml'
		});
	} catch {
		const escapedExpression = escapeHtml(expression);
		return displayMode
			? `<pre class="math-fallback">\\[${escapedExpression}\\]</pre>`
			: `<code class="math-fallback">\\(${escapedExpression}\\)</code>`;
	}
}

function createMathToken(type: 'mathInline' | 'mathBlock', raw: string, displayMode: boolean): MathToken {
	return {
		type,
		raw,
		text: raw.slice(2, -2).trim(),
		displayMode
	};
}

const mathBlockExtension: TokenizerAndRendererExtension = {
	name: 'mathBlock',
	level: 'block',
	start(src) {
		return src.indexOf('\\[');
	},
	tokenizer(src) {
		if (!src.startsWith('\\[')) return;

		const endIndex = src.indexOf('\\]', 2);
		if (endIndex === -1) return;

		return createMathToken('mathBlock', src.slice(0, endIndex + 2), true);
	},
	renderer(token) {
		const mathToken = token as MathToken;
		return renderMathExpression(mathToken.text, mathToken.displayMode);
	}
};

const mathInlineExtension: TokenizerAndRendererExtension = {
	name: 'mathInline',
	level: 'inline',
	start(src) {
		return src.indexOf('\\(');
	},
	tokenizer(src) {
		if (!src.startsWith('\\(')) return;

		const endIndex = src.indexOf('\\)', 2);
		if (endIndex === -1) return;

		const newlineIndex = src.indexOf('\n');
		if (newlineIndex !== -1 && newlineIndex < endIndex) return;

		return createMathToken('mathInline', src.slice(0, endIndex + 2), false);
	},
	renderer(token) {
		const mathToken = token as MathToken;
		return renderMathExpression(mathToken.text, mathToken.displayMode);
	}
};

const mathExtension: MarkedExtension = {
	extensions: [mathBlockExtension, mathInlineExtension]
};

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

function isTocHeading(token: Token): token is Tokens.Heading {
	return token.type === 'heading' && token.depth >= MIN_TOC_DEPTH && token.depth <= MAX_TOC_DEPTH;
}

function getInlineTokenText(token: Token): string {
	if ('tokens' in token && Array.isArray(token.tokens) && token.tokens.length > 0) {
		return token.tokens.map(getInlineTokenText).join('');
	}
	if ('text' in token && typeof token.text === 'string') {
		return token.text;
	}
	return '';
}

function getHeadingText(heading: Tokens.Heading): string {
	const tokenText = heading.tokens.map(getInlineTokenText).join('').trim();
	return tokenText || heading.text.trim();
}

function slugifyHeading(text: string): string {
	const slug = text
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

	return slug || 'section';
}

function getUniqueSlug(baseSlug: string, slugCounts: Map<string, number>): string {
	const currentCount = slugCounts.get(baseSlug) ?? 0;
	slugCounts.set(baseSlug, currentCount + 1);
	return currentCount === 0 ? baseSlug : `${baseSlug}-${currentCount + 1}`;
}

function collectTocItems(markdown: string): TocItem[] {
	const markdownParser = new Marked(MARKED_OPTIONS);
	const slugCounts = new Map<string, number>();
	const tocItems: TocItem[] = [];
	const tokens = markdownParser.lexer(markdown);

	markdownParser.walkTokens(tokens, (token) => {
		if (!isTocHeading(token)) return;

		const text = getHeadingText(token);
		const id = getUniqueSlug(slugifyHeading(text), slugCounts);
		tocItems.push({
			id,
			text,
			depth: token.depth
		});
	});

	return tocItems;
}

function buildTocHtml(tocItems: TocItem[]): string {
	if (tocItems.length === 0) {
		return '';
	}

	const links = tocItems
		.map(
			(item) =>
				`<li class="post-toc-item depth-${item.depth}"><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`
		)
		.join('\n');

	return `<nav class="post-toc" aria-label="목차">
<strong class="post-toc-title">목차</strong>
<ul>
${links}
</ul>
</nav>`;
}

function replaceTocMarkers(markdown: string, tocHtml: string): string {
	let replacedFirstMarker = false;
	return markdown.replace(TOC_MARKER_PATTERN, () => {
		if (replacedFirstMarker) {
			return '';
		}

		replacedFirstMarker = true;
		return tocHtml;
	});
}

function createMarkdownParser(tocItems: TocItem[] | null): Marked {
	const renderer = new Renderer();
	const headingIds = tocItems?.map((item) => item.id) ?? [];
	let headingIndex = 0;

	renderer.image = ({ href, title, text }) => {
		const titleAttr = title ? ` title="${title}"` : '';
		return `<img src="${href}" alt="${text}"${titleAttr} style="max-width: 100%; height: auto; display: block; margin: 1rem auto;">`;
	};

	if (tocItems) {
		renderer.heading = function ({ tokens, depth }) {
			const headingHtml = this.parser.parseInline(tokens);
			if (depth < MIN_TOC_DEPTH || depth > MAX_TOC_DEPTH) {
				return `<h${depth}>${headingHtml}</h${depth}>\n`;
			}

			const id = headingIds[headingIndex];
			headingIndex += 1;
			if (!id) {
				return `<h${depth}>${headingHtml}</h${depth}>\n`;
			}

			return `<h${depth} id="${escapeHtml(id)}">${headingHtml}</h${depth}>\n`;
		};
	}

	return new Marked(
		MARKED_OPTIONS,
		{ renderer },
		mathExtension,
		markedHighlight({
			langPrefix: 'hljs language-',
			highlight(code, lang) {
				const language = hljs.getLanguage(lang) ? lang : 'plaintext';
				return hljs.highlight(code, { language }).value;
			}
		})
	);
}

function prepareMarkdownForRendering(markdown: string): { markdown: string; tocItems: TocItem[] | null } {
	if (!HAS_TOC_MARKER_PATTERN.test(markdown)) {
		return { markdown, tocItems: null };
	}

	const tocItems = collectTocItems(markdown);
	return {
		markdown: replaceTocMarkers(markdown, buildTocHtml(tocItems)),
		tocItems
	};
}

function getFileName(path: string): string {
	return path.split('/').pop() ?? path;
}

function toMetadata(post: ParsedPost): Omit<BlogPost, 'content'> {
	return {
		id: post.id,
		title: post.title,
		excerpt: post.excerpt,
		date: post.date,
		author: post.author,
		tags: post.tags
	};
}

function readAllPosts(): { posts: ParsedPost[]; skipped: string[] } {
	const skipped: string[] = [];
	const posts: ParsedPost[] = [];

	Object.entries(postFiles).forEach(([path, fileContents]) => {
		const fileName = getFileName(path);

		try {
			const { data, content } = matter(fileContents);
			const id = normalizeString(data.id);
			const title = normalizeString(data.title);
			const date = normalizeString(data.date);

			if (!id || !title || !date) {
				skipped.push(fileName);
				return;
			}

			posts.push({
				id,
				title,
				excerpt: normalizeString(data.excerpt),
				date,
				author: normalizeString(data.author),
				tags: normalizeTags(data.tags),
				refs: parseRefsFromContent(content),
				content,
				filename: fileName,
				secret: data.secret === true,
				password: normalizeString(data.password)
			});
		} catch {
			skipped.push(fileName);
		}
	});

	return { posts, skipped };
}

function getPublicPosts(posts: ParsedPost[]): ParsedPost[] {
	return posts.filter((post) => !post.secret);
}

function findPostById(id: string): ParsedPost | null {
	return readAllPosts().posts.find((post) => post.id === id) ?? null;
}

function getValidLinkIds(sourcePost: ParsedPost, allPosts: ParsedPost[]): Set<string> {
	const linkablePosts = sourcePost.secret ? allPosts : getPublicPosts(allPosts);
	return new Set(linkablePosts.map((post) => post.id));
}

function isSameSecret(expected: string, actual: string): boolean {
	const expectedBuffer = Buffer.from(expected);
	const actualBuffer = Buffer.from(actual);
	if (expectedBuffer.length !== actualBuffer.length) {
		return false;
	}
	return timingSafeEqual(expectedBuffer, actualBuffer);
}

async function renderPost(post: ParsedPost, allPosts: ParsedPost[]): Promise<BlogPost> {
	const normalizedMarkdown = convertWikiLinksToMarkdown(post.content, getValidLinkIds(post, allPosts));
	const preparedMarkdown = prepareMarkdownForRendering(normalizedMarkdown);
	const htmlContent = await createMarkdownParser(preparedMarkdown.tocItems).parse(preparedMarkdown.markdown);

	return {
		...toMetadata(post),
		content: htmlContent
	};
}

export function getAllPostsMetadata(): Omit<BlogPost, 'content'>[] {
	const { posts } = readAllPosts();

	return getPublicPosts(posts)
		.map(toMetadata)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function buildGraphData(): GraphData {
	const { posts, skipped } = readAllPosts();
	const publicPosts = getPublicPosts(posts);
	const tagSet = new Set<string>();
	publicPosts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));

	const nodes: GraphNode[] = [
		...publicPosts.map((post) => ({
			id: `post:${post.id}`,
			type: 'post' as const,
			label: post.title,
			tags: post.tags,
			slug: post.id,
			date: post.date,
			author: post.author,
			excerpt: post.excerpt,
			weight: Math.max(1, post.refs.length || 1),
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
	const publicPostIdSet = new Set(publicPosts.map((post) => post.id));

	publicPosts.forEach((post) => {
		post.refs.forEach((refId) => {
			if (publicPostIdSet.has(refId) && refId !== post.id) {
				links.push({
					type: 'ref',
					source: `post:${post.id}`,
					target: `post:${refId}`,
					weight: 1
				});
			}
		});
	});

	publicPosts.forEach((post) => {
		post.tags.forEach((tag) => {
			links.push({
				type: 'post-tag',
				source: `post:${post.id}`,
				target: `tag:${tag}`,
				weight: 1
			});
		});
	});

	const scoreMap = new Map<string, number>();
	const bump = (id: string, weight: number) => {
		if (!id.startsWith('post:')) return;
		scoreMap.set(id, (scoreMap.get(id) ?? 0) + weight);
	};

	links
		.filter((link) => link.type === 'ref')
		.forEach((link) => {
			const weight = link.weight ?? 1;
			const source = typeof link.source === 'string' ? link.source : link.source.id;
			const target = typeof link.target === 'string' ? link.target : link.target.id;
			bump(source, weight);
			bump(target, weight);
		});

	nodes.forEach((node) => {
		if (node.type === 'post') {
			node.score = scoreMap.get(node.id) ?? 0;
		}
	});

	const stats: GraphStats = {
		totalPosts: publicPosts.length,
		totalTags: tagSet.size,
		refEdges: links.filter((link) => link.type === 'ref').length,
		sharedTagEdges: 0,
		postTagEdges: links.filter((link) => link.type === 'post-tag').length,
		skippedFiles: skipped
	};

	return { nodes, links, stats };
}

export async function getPostById(id: string, options: { includeSecret?: boolean } = {}): Promise<BlogPost | null> {
	const { posts } = readAllPosts();
	const post = posts.find((candidate) => candidate.id === id);

	if (!post || (post.secret && !options.includeSecret)) {
		return null;
	}

	return renderPost(post, posts);
}

export function getPostMetadata(id: string): Omit<BlogPost, 'content'> | null {
	const post = findPostById(id);
	return post ? toMetadata(post) : null;
}

export function isSecretPost(id: string): boolean {
	return findPostById(id)?.secret ?? false;
}

export function verifyPostPassword(id: string, password: string): boolean {
	const post = findPostById(id);
	if (!post?.secret || post.password.length === 0) {
		return false;
	}

	return isSameSecret(post.password, password);
}

export function getRecentPosts(limit: number = 5): Omit<BlogPost, 'content'>[] {
	return getAllPostsMetadata().slice(0, limit);
}
