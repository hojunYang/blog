<script lang="ts">
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import '../app.css';
	import '$lib/assets/fira_code.css';
	import '$lib/assets/fonts.css';
	import 'highlight.js/styles/atom-one-dark.css';
	import 'katex/dist/katex.min.css';
	import Header from '$lib/components/Header.svelte';
	// import Footer from '$lib/components/Footer.svelte';
	import favicon from '$lib/assets/favicon.ico';

	let { children } = $props();
	let isFallbackNavigating = $state(false);
	let isScoreRoute = $derived(page.url.pathname.startsWith('/score'));

	onNavigate((navigation) => {
		if (
			navigation.willUnload ||
			typeof document === 'undefined' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return;
		}

		if (document.startViewTransition) {
			return new Promise((resolve) => {
				document.startViewTransition(async () => {
					resolve();
					await navigation.complete;
				});
			});
		}

		if (isFallbackNavigating) return;

		isFallbackNavigating = true;
		return new Promise((resolve) => window.setTimeout(resolve, 160));
	});

	afterNavigate(() => {
		if (!isFallbackNavigating) return;
		window.requestAnimationFrame(() => {
			isFallbackNavigating = false;
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Hojun Yang Blog</title>
</svelte:head>

<div class="app" class:route-transitioning={isFallbackNavigating}>
	{#if !isScoreRoute}
		<Header />
	{/if}
	<main class:score-main={isScoreRoute}>
		{@render children()}
	</main>
	<!-- <Footer /> -->
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		transform: translateY(0) scale(1);
		transition:
			transform var(--transition-base),
			opacity var(--transition-base);
	}

	.app.route-transitioning {
		opacity: 0.22;
		transform: scale(0.996);
		transition:
			transform var(--duration-fast) var(--ease-out),
			opacity var(--duration-fast) var(--ease-out);
		will-change: transform, opacity;
	}

	main {
		flex: 1;
		width: 100%;
		max-width: var(--container-max-width);
		margin: 0 auto;
		padding: var(--spacing-xl);
	}

	main.score-main {
		max-width: none;
		padding: 0;
	}

	@media (max-width: 1200px) {
		main {
			padding: var(--spacing-md);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.app,
		.app.route-transitioning {
			transform: none;
			transition: none;
		}
	}
</style>
