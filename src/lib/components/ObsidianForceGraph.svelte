<script lang="ts">
	import { goto } from '$app/navigation';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import type { GraphData, GraphLink, GraphNode } from '$lib/types';

	interface Props {
		graphData: GraphData;
	}

	type ForceNode = {
		id: string;
		label: string;
		kind: 'post';
		slug?: string;
		tags: string[];
		score: number;
		color: string;
		radius: number;
		x?: number;
		y?: number;
		fx?: number | null;
		fy?: number | null;
	};

	type ForceLink = {
		source: string | ForceNode;
		target: string | ForceNode;
		type: GraphLink['type'];
		weight: number;
	};

	let { graphData }: Props = $props();
	let containerEl: HTMLDivElement | null = null;

	let instance: any = null;
	const palette = ['#4f83ff', '#1bb1ff', '#15c48f', '#f6b454', '#f35b4f'];
	const REF_LINK_DISTANCE = 240;
	const SHARED_TAG_DISTANCE = 170;
	const REF_LINK_STRENGTH = 0.04;
	const SHARED_TAG_STRENGTH = 0.055;
	const CENTER_STRENGTH = 0.002;
	const CHARGE_STRENGTH = -230;

	function scoreRadius(score: number): number {
		return 7 + Math.min(Math.max(score, 1), 12) * 0.9;
	}

	function isPostNode(node: GraphNode): node is Extract<GraphNode, { type: 'post' }> {
		return node.type === 'post';
	}

	function buildSharedTagLinks(posts: Extract<GraphNode, { type: 'post' }>[]): ForceLink[] {
		const links: ForceLink[] = [];
		const tagSets = posts.map((post) => new Set(post.tags));

		for (let i = 0; i < posts.length; i += 1) {
			for (let j = i + 1; j < posts.length; j += 1) {
				const a = tagSets[i];
				const b = tagSets[j];
				const [small, large] = a.size <= b.size ? [a, b] : [b, a];
				let sharedCount = 0;
				small.forEach((tag) => {
					if (large.has(tag)) sharedCount += 1;
				});

				if (sharedCount > 0) {
					links.push({
						source: posts[i].id,
						target: posts[j].id,
						type: 'shared-tag',
						weight: sharedCount
					});
				}
			}
		}

		return links;
	}

	function normalizeGraph(data: GraphData): { nodes: ForceNode[]; links: ForceLink[] } {
		const posts = data.nodes.filter(isPostNode);
		const quantile = d3.scaleQuantile<string>().domain(posts.map((p) => p.score ?? 0)).range(palette);

		const nodes: ForceNode[] = posts.map((post) => {
			const score = post.score ?? 0;
			return {
				id: post.id,
				label: post.label,
				kind: 'post',
				slug: post.slug,
				tags: post.tags,
				score,
				color: posts.length > 0 ? quantile(score) : palette[0],
				radius: scoreRadius(score)
			};
		});

		const refLinks: ForceLink[] = data.links
			.filter((l) => l.type === 'ref')
			.map((l) => ({
				source: typeof l.source === 'string' ? l.source : l.source.id,
				target: typeof l.target === 'string' ? l.target : l.target.id,
				type: l.type,
				weight: l.weight ?? 1
			}));

		const sharedTagLinks = buildSharedTagLinks(posts);
		const links = [...refLinks, ...sharedTagLinks];
		return { nodes, links };
	}

	function applyData() {
		if (!instance || !graphData) return;
		instance.graphData(normalizeGraph(graphData));
		instance.d3ReheatSimulation();
	}

	onMount(() => {
		let disposed = false;
		let resize: (() => void) | null = null;

		void (async () => {
			if (!containerEl || disposed) return;

			const ForceGraphModule = await import('force-graph');
			const ForceGraphFactory = ForceGraphModule.default as any;
			if (!containerEl || disposed) return;

			instance = ForceGraphFactory()(containerEl)
			.backgroundColor('rgba(0,0,0,0)')
			.nodeId('id')
			.nodeLabel((node: ForceNode) => {
				const tagLine = node.tags.length > 0 ? node.tags.join(', ') : '없음';
				return `${node.label}\n태그: ${tagLine}`;
			})
			.nodeCanvasObject((node: ForceNode, ctx: CanvasRenderingContext2D) => {
				ctx.beginPath();
				ctx.arc(node.x ?? 0, node.y ?? 0, node.radius, 0, Math.PI * 2, false);
				ctx.fillStyle = node.color;
				ctx.fill();
			})
			.nodePointerAreaPaint((node: ForceNode, color: string, ctx: CanvasRenderingContext2D) => {
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(node.x ?? 0, node.y ?? 0, node.radius + 2, 0, Math.PI * 2, false);
				ctx.fill();
			})
			.linkColor((link: ForceLink) => (link.type === 'shared-tag' ? 'rgba(242,201,76,0.26)' : 'rgba(113,128,150,0.24)'))
			.linkWidth((link: ForceLink) => (link.type === 'shared-tag' ? 0.6 + link.weight * 0.48 : 1))
			.linkLineDash((link: ForceLink) => (link.type === 'ref' ? [4, 2] : null))
			.onNodeClick((node: ForceNode) => {
				if (node.slug) {
					goto(`/post/${node.slug}`);
				}
			})
			.onNodeDragEnd((node: ForceNode) => {
				node.fx = null;
				node.fy = null;
			});

			const linkForce = instance.d3Force('link');
			if (linkForce) {
				linkForce.distance((link: ForceLink) => (link.type === 'shared-tag' ? SHARED_TAG_DISTANCE : REF_LINK_DISTANCE));
				linkForce.strength((link: ForceLink) => (link.type === 'shared-tag' ? SHARED_TAG_STRENGTH : REF_LINK_STRENGTH));
			}

			instance.d3Force('charge', d3.forceManyBody().strength(CHARGE_STRENGTH));
			instance.d3Force('collide', d3.forceCollide<ForceNode>().radius((n) => n.radius + 7));
			instance.d3Force('x', d3.forceX(0).strength(CENTER_STRENGTH));
			instance.d3Force('y', d3.forceY(0).strength(CENTER_STRENGTH));

			resize = () => {
				if (!containerEl || !instance) return;
				instance.width(containerEl.clientWidth);
				instance.height(containerEl.clientHeight);
				instance.centerAt(0, 0, 0);
				instance.zoom(0.95, 0);
			};

			window.addEventListener('resize', resize);
			resize();
			applyData();
		})();

		return () => {
			disposed = true;
			if (resize) {
				window.removeEventListener('resize', resize);
			}
			if (instance) {
				instance.pauseAnimation();
			}
			instance = null;
		};
	});

	$effect(() => {
		applyData();
	});
</script>

<div class="force-graph-root" bind:this={containerEl}></div>

<style>
	.force-graph-root {
		width: 100%;
		height: 100%;
	}
</style>
