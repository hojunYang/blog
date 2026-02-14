<script lang="ts">
	import { goto } from '$app/navigation';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
import type { GraphData, GraphLink } from '$lib/types';

	interface Props {
		graphData: GraphData;
	}

	type ForceNode = {
		id: string;
		label: string;
		kind: 'post' | 'tag';
		slug?: string;
		tags?: string[];
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
		tags?: string[];
	};

	let { graphData }: Props = $props();
	let containerEl: HTMLDivElement | null = null;

	let instance: any = null;
	const tagColor = '#f2c94c';
	const palette = ['#4f83ff', '#1bb1ff', '#15c48f', '#f6b454', '#f35b4f'];

	function scoreRadius(score: number): number {
		return 7 + Math.min(Math.max(score, 1), 12) * 0.9;
	}

	function tagTarget(label: string): { x: number; y: number } {
		const hash = Array.from(label).reduce((acc, c) => acc + c.charCodeAt(0), 0);
		const angle = ((hash % 360) * Math.PI) / 180;
		const r = 160;
		return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
	}

	function normalizeGraph(data: GraphData): { nodes: ForceNode[]; links: ForceLink[] } {
		const posts = data.nodes.filter((n) => n.type === 'post');
		const quantile = d3.scaleQuantile<string>().domain(posts.map((p) => p.score ?? 0)).range(palette);

		const nodes: ForceNode[] = data.nodes.map((n) => {
			if (n.type === 'tag') {
				const target = tagTarget(n.label);
				return {
					id: n.id,
					label: n.label,
					kind: 'tag',
					score: n.score ?? 0,
					color: tagColor,
					radius: 6,
					x: target.x,
					y: target.y
				};
			}

			const score = n.score ?? 0;
			return {
				id: n.id,
				label: n.label,
				kind: 'post',
				slug: n.slug,
				tags: n.tags,
				score,
				color: posts.length > 0 ? quantile(score) : palette[0],
				radius: scoreRadius(score)
			};
		});

		const links: ForceLink[] = data.links.map((l) => ({
			source: typeof l.source === 'string' ? l.source : l.source.id,
			target: typeof l.target === 'string' ? l.target : l.target.id,
			type: l.type,
			weight: l.weight ?? 1,
			tags: l.tags
		}));

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
				if (node.kind === 'tag') return node.label;
				return `${node.label}\n태그: ${(node.tags ?? []).join(', ')}\nscore: ${node.score}`;
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
			.linkColor((link: ForceLink) => (link.type === 'shared-tag' ? 'rgba(113,128,150,0.36)' : 'rgba(113,128,150,0.24)'))
			.linkWidth((link: ForceLink) => {
				if (link.type === 'shared-tag') return 1 + link.weight * 0.35;
				if (link.type === 'post-tag') return 1.3;
				return 0.9;
			})
			.linkLineDash((link: ForceLink) => (link.type === 'ref' ? [4, 2] : null))
			.onNodeClick((node: ForceNode) => {
				if (node.kind === 'post' && node.slug) {
					goto(`/post/${node.slug}`);
				}
			})
			.onNodeDragEnd((node: ForceNode) => {
				node.fx = null;
				node.fy = null;
			});

			instance.d3Force('charge', d3.forceManyBody().strength(-60));
			instance.d3Force('collide', d3.forceCollide<ForceNode>().radius((n) => n.radius + 3));
			instance.d3Force(
				'tag-x',
				d3.forceX((n: ForceNode) => (n.kind === 'tag' ? tagTarget(n.label).x : 0)).strength((n) =>
					n.kind === 'tag' ? 0.08 : 0
				)
			);
			instance.d3Force(
				'tag-y',
				d3.forceY((n: ForceNode) => (n.kind === 'tag' ? tagTarget(n.label).y : 0)).strength((n) =>
					n.kind === 'tag' ? 0.08 : 0
				)
			);

			resize = () => {
				if (!containerEl || !instance) return;
				instance.width(containerEl.clientWidth);
				instance.height(containerEl.clientHeight);
				instance.centerAt(0, 0, 0);
				instance.zoom(1.1, 0);
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
