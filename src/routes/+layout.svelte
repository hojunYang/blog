<script lang="ts">
	import '../app.css';
	import '$lib/assets/fira_code.css';
	import 'highlight.js/styles/atom-one-dark.css';
	import Header from '$lib/components/Header.svelte';
	// import Footer from '$lib/components/Footer.svelte';
	import favicon from '$lib/assets/favicon.ico';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Hojun Yang Blog</title>
</svelte:head>

<div class="app">
	<Header />
	<main>
		{@render children()}
	</main>
	<!-- <Footer /> -->
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		width: 100%;
		max-width: var(--container-max-width);
		margin: 0 auto;
		padding: var(--spacing-xl);
	}

	@media (max-width: 1200px) {
		main {
			padding: var(--spacing-md);
		}
	}
</style>
