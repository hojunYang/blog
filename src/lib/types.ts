export interface BlogPost {
	id: string;
	title: string;
	excerpt: string;
	content: string;
	date: string;
	author: string;
	tags: string[];
	coverImage?: string;
}

import type { SimulationNodeDatum } from 'd3';

type GraphSimFields = SimulationNodeDatum & {
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
	fx?: number | null;
	fy?: number | null;
};

export type GraphNode =
	| (GraphSimFields & {
			id: string;
			type: 'post';
			label: string;
			tags: string[];
			slug: string;
			date?: string;
			author?: string;
			excerpt?: string;
			score?: number;
			weight?: number;
	  })
	| (GraphSimFields & {
			id: string;
			type: 'tag';
			label: string;
			score?: number;
			weight?: number;
	  });

export interface GraphLink {
	source: string | GraphNode;
	target: string | GraphNode;
	type: 'ref' | 'shared-tag' | 'post-tag';
	tags?: string[]; // for shared-tag edges
	weight?: number;
}

export interface GraphData {
	nodes: GraphNode[];
	links: GraphLink[];
	stats: GraphStats;
}

export interface GraphStats {
	totalPosts: number;
	totalTags: number;
	refEdges: number;
	sharedTagEdges: number;
	postTagEdges: number;
	skippedFiles: string[];
}

export interface PostMetrics {
	postId: string;
	likes: number;
	views: number;
	likedByMe: boolean;
	viewCountedThisRequest?: boolean;
}

export interface MetricEventResult {
	counted: boolean;
	metrics: PostMetrics;
}

export interface PostComment {
	id: number;
	postId: string;
	authorName: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}
