<script lang="ts">
	import { onMount } from 'svelte';
	import Scoreboard from './Scoreboard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let scores = $state(data.scores);

	onMount(() => {
		const refresh = async () => {
			try {
				const response = await fetch('/score/api', { cache: 'no-store' });
				if (!response.ok) throw new Error();
				scores = await response.json();
			} catch { /* Keep the last displayed score if a refresh fails. */ }
		};
		refresh();
		const events = new EventSource('/score/events');
		events.addEventListener('scores', refresh);
		return () => events.close();
	});
</script>

<svelte:head><title>Scoreboard</title></svelte:head>

<section class="score-page"><Scoreboard {scores} /></section>

<style>
	.score-page { min-height: 100vh; padding: clamp(26px, 5vw, 72px); display: grid; place-items: center; background: #fff; }
</style>
