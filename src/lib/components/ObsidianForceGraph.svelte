<script lang="ts">
	import { goto } from '$app/navigation';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { getTagColor, normalizeTagKey } from '$lib/tag-colors';
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
		primaryTag: string | null;
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

	type LegendItem = {
		key: string;
		label: string;
		color: string;
	};

	let { graphData }: Props = $props();
	let containerEl: HTMLDivElement | null = null;
	let activeTagKey = $state<string | null>(null);

	let instance: any = null;
	const UNTAGGED_KEY = '__untagged__';
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

	function getPrimaryTag(tags: string[]): string | null {
		return tags.find((tag) => tag.trim().length > 0) ?? null;
	}

	function getTagKey(tag: string | null): string {
		return tag ? normalizeTagKey(tag) : UNTAGGED_KEY;
	}

	function getLegendItems(data: GraphData): LegendItem[] {
		const primaryTags = new Map<string, LegendItem>();

		data.nodes.filter(isPostNode).forEach((post) => {
			const tag = getPrimaryTag(post.tags);
			const key = getTagKey(tag);
			primaryTags.set(key, {
				key,
				label: tag ?? '태그 없음',
				color: getTagColor(tag)
			});
		});

		return Array.from(primaryTags.values())
			.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
	}

	const legendItems = $derived(getLegendItems(graphData));

	function nodeMatchesTag(node: ForceNode, tagKey: string): boolean {
		if (tagKey === UNTAGGED_KEY) {
			return getPrimaryTag(node.tags) === null;
		}

		return node.tags.some((tag) => normalizeTagKey(tag) === tagKey);
	}

	function getNodeOpacity(node: ForceNode): number {
		if (!activeTagKey || nodeMatchesTag(node, activeTagKey)) {
			return 1;
		}

		return 0.16;
	}

	function getLinkOpacity(link: ForceLink): number {
		if (!activeTagKey) return 1;

		const source = typeof link.source === 'string' ? null : link.source;
		const target = typeof link.target === 'string' ? null : link.target;
		if (!source || !target) return 0.08;

		const sourceMatches = nodeMatchesTag(source, activeTagKey);
		const targetMatches = nodeMatchesTag(target, activeTagKey);
		if (sourceMatches && targetMatches) return 1;
		if (sourceMatches || targetMatches) return 0.24;
		return 0.08;
	}

	function getLinkColor(link: ForceLink): string {
		const opacity = getLinkOpacity(link);
		return link.type === 'shared-tag'
			? `rgba(242, 201, 76, ${0.26 * opacity})`
			: `rgba(113, 128, 150, ${0.24 * opacity})`;
	}

	function toggleTagHighlight(tagKey: string): void {
		activeTagKey = activeTagKey === tagKey ? null : tagKey;
		instance?.refresh();
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

		const nodes: ForceNode[] = posts.map((post) => {
			const score = post.score ?? 0;
			const primaryTag = getPrimaryTag(post.tags);
			return {
				id: post.id,
				label: post.label,
				kind: 'post',
				slug: post.slug,
				tags: post.tags,
				primaryTag,
				score,
				color: getTagColor(primaryTag),
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
				const primaryTagLine = node.primaryTag ?? '태그 없음';
				return `${node.label}\n대표 태그: ${primaryTagLine}\n전체 태그: ${tagLine}`;
			})
			.nodeCanvasObject((node: ForceNode, ctx: CanvasRenderingContext2D) => {
				const opacity = getNodeOpacity(node);

				ctx.save();
				if (activeTagKey && opacity === 1) {
					ctx.globalAlpha = 0.16;
					ctx.fillStyle = node.color;
					ctx.beginPath();
					ctx.arc(node.x ?? 0, node.y ?? 0, node.radius + 5, 0, Math.PI * 2, false);
					ctx.fill();
				}

				ctx.globalAlpha = opacity;
				ctx.beginPath();
				ctx.arc(node.x ?? 0, node.y ?? 0, node.radius, 0, Math.PI * 2, false);
				ctx.fillStyle = node.color;
				ctx.fill();
				ctx.lineWidth = 1;
				ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
				ctx.stroke();
				ctx.restore();
			})
			.nodePointerAreaPaint((node: ForceNode, color: string, ctx: CanvasRenderingContext2D) => {
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(node.x ?? 0, node.y ?? 0, node.radius + 2, 0, Math.PI * 2, false);
				ctx.fill();
			})
			.linkColor((link: ForceLink) => getLinkColor(link))
			.linkWidth((link: ForceLink) => {
				const baseWidth = link.type === 'shared-tag' ? 0.6 + link.weight * 0.48 : 1;
				return activeTagKey && getLinkOpacity(link) === 1 ? baseWidth + 0.35 : baseWidth;
			})
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

<div class="force-graph">
	<div class="force-graph-root" bind:this={containerEl}></div>

	{#if legendItems.length > 0}
		<aside class="graph-legend" aria-label="대표 태그 색상">
			<ul>
				{#each legendItems as item}
					<li>
						<button
							type="button"
							class="legend-button"
							class:active={activeTagKey === item.key}
							aria-pressed={activeTagKey === item.key}
							aria-label={`${item.label} 태그 노드 강조`}
							onclick={() => toggleTagHighlight(item.key)}
						>
							<span class="legend-swatch" style:background-color={item.color}></span>
							<span class="legend-label">{item.label}</span>
						</button>
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
</div>

<style>
	.force-graph {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.force-graph-root {
		width: 100%;
		height: 100%;
	}

	.graph-legend {
		position: absolute;
		top: 38.6%;
		right: 0;
		z-index: 1;
		inline-size: max-content;
		max-inline-size: calc(100% - 1.5rem);
		max-block-size: calc(100% - 1.5rem);
		overflow-y: auto;
		padding: 0.4rem;
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: var(--radius-sm);
		background: rgba(255, 255, 255, 0.9);
		box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
		backdrop-filter: blur(14px) saturate(160%);
		transform: translateY(-50%);
		transition:
			transform var(--transition-fast),
			box-shadow var(--transition-fast);
	}

	.graph-legend ul {
		display: grid;
		gap: 0.35rem;
		min-inline-size: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.graph-legend li {
		display: block;
		min-inline-size: 0;
	}

	.legend-button {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		width: 100%;
		min-inline-size: 0;
		gap: var(--spacing-xs);
		margin: 0;
		padding: 0.35rem 0.45rem;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: var(--font-xs);
		line-height: 1.3;
		text-align: left;
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		-webkit-user-select: none;
		transition:
			transform var(--transition-fast),
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.legend-button.active {
		background: rgba(15, 23, 42, 0.07);
		color: var(--color-text-primary);
	}

	.legend-button:active {
		transform: scale(0.97);
	}

	.legend-swatch {
		width: 0.625rem;
		height: 0.625rem;
		border: 1px solid rgba(15, 23, 42, 0.14);
		border-radius: 50%;
		flex: 0 0 auto;
	}

	.legend-label {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (hover: hover) and (pointer: fine) {
		.legend-button:hover {
			background: rgba(15, 23, 42, 0.045);
			transform: translateX(-1px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.legend-button,
		.graph-legend {
			transition: opacity 120ms linear;
		}

		.legend-button:active {
			transform: none;
		}

		.legend-button:hover {
			transform: none;
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		.graph-legend {
			background: var(--bg);
			backdrop-filter: none;
		}
	}
</style>
