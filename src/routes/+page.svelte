<script lang="ts">
	import ObsidianForceGraph from '$lib/components/ObsidianForceGraph.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import type { GraphData } from '$lib/types';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const graphData = $derived(data.graph as GraphData | undefined);
	const recentPosts = $derived(data.recentPosts ?? []);
	let isMobile = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const onResize = () => {
			isMobile = window.innerWidth <= 1200;
		};
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<svelte:head>
	<title>홈 - Hojun Yang</title>
</svelte:head>

<div class="home">
	{#if graphData && graphData.nodes.length > 0 && !isMobile}
		<div class="graph-container">
			<ObsidianForceGraph {graphData} />
		</div>
	{:else}
		<div class="fallback">
			<div class="posts-grid minimal">
				{#each recentPosts as post}
					<PostCard {post} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.home {
		animation: fadeIn 0.4s ease-in;
		min-height: 100vh;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.graph-container {
		position: relative;
		width: 100vw;
		height: 100vh;
		background: var(--bg);
		overflow: hidden;
	}

	.fallback {
		background: var(--bg);
		padding: var(--spacing-lg) var(--spacing-xl);
	}

	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--spacing-xl);
	}

	.posts-grid.minimal {
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--spacing-md);
	}

	:global(body) {
		background: var(--bg);
	}

	:global(main) {
		padding: 0;
		max-width: none;
	}

	:global(header) {
		background: transparent;
		box-shadow: none;
	}

	:global(header nav .container) {
		padding-left: var(--spacing-xl);
		padding-right: var(--spacing-xl);
	}

	:global(.logo),
	:global(.nav-links a) {
		color: var(--text);
	}
</style>
