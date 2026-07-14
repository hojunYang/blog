<script lang="ts">
	import { onMount } from 'svelte';
	import Scoreboard from './Scoreboard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let scores = $state(data.scores);
	let online = $state(true);

	onMount(() => {
		const refresh = async () => {
			try {
				const response = await fetch('/score/api', { cache: 'no-store' });
				if (!response.ok) throw new Error();
				scores = await response.json();
				online = true;
			} catch { online = false; }
		};
		refresh();
		const timer = window.setInterval(refresh, 3000);
		return () => window.clearInterval(timer);
	});
</script>

<svelte:head><title>Scoreboard</title></svelte:head>

<section class="score-page">
	<header>
		<div><p class="eyebrow">LIVE SCOREBOARD</p><h1>오늘의 점수</h1></div>
		<div class:offline={!online} class="status"><span></span>{online ? 'LIVE' : 'RECONNECTING'}</div>
	</header>
	<Scoreboard {scores} />
</section>

<style>
	.score-page { min-height: 100vh; padding: clamp(26px, 5vw, 72px); background: radial-gradient(circle at 10% 0%, #fff0dc, transparent 32%), radial-gradient(circle at 100% 100%, #d8f4ef, transparent 35%), #f7f8fc; }
	header { width: min(1420px, 100%); margin: 0 auto clamp(28px, 5vw, 68px); display: flex; align-items: end; justify-content: space-between; gap: 20px; }
	.eyebrow { margin: 0 0 12px; color: #6c7586; font: 700 12px var(--font-mono); letter-spacing: .14em; } h1 { margin: 0; color: #17212b; font-size: clamp(34px, 5vw, 70px); letter-spacing: -.07em; line-height: .95; } .status { display: flex; align-items: center; gap: 8px; color: #197760; font: 700 12px var(--font-mono); letter-spacing: .08em; } .status span { height: 9px; width: 9px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 6px rgb(25 119 96 / 12%); } .status.offline { color: #b25e35; }
	@media (max-width: 520px) { header { align-items: start; flex-direction: column; } }
</style>
