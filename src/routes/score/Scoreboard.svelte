<script lang="ts">
	import type { Scoreboard as ScoreboardData } from './scoreboard.server';

	let { scores }: { scores: ScoreboardData } = $props();
	const teams = [
		{ id: 'coral', color: 'coral' },
		{ id: 'sky', color: 'sky' },
		{ id: 'violet', color: 'violet' },
		{ id: 'green', color: 'green' }
	] as const;
</script>

<div class="score-grid" aria-label="현재 점수">
	{#each teams as team, index}
		<article class="score-card {team.color}" style:--card-index={index}>
			<strong>{scores[team.id]}</strong>
		</article>
	{/each}
</div>

<style>
	.score-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(12px, 2vw, 28px); width: min(1420px, 100%); }
	.score-card { min-height: clamp(290px, 43vw, 520px); padding: clamp(22px, 2.2vw, 38px); border-radius: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; box-shadow: 0 18px 42px rgb(24 31 45 / 14%); animation: rise .65s calc(var(--card-index) * 90ms) both cubic-bezier(.22,1,.36,1); }
	.coral { background: #f5a293; }.sky { background: #56ccf2; }.violet { background: #9f87dd; }.green { background: #6fcf97; }
	strong { font-family: var(--font-sans); font-size: clamp(88px, 12vw, 184px); letter-spacing: -.1em; line-height: 1; font-weight: 800; text-align: center; font-variant-numeric: tabular-nums; transform: translateX(-10px); }
	@keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } } @media (max-width: 760px) { .score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .score-card { min-height: 250px; border-radius: 22px; } } @media (max-width: 420px) { .score-grid { gap: 10px; } .score-card { min-height: 205px; padding: 18px; } } @media (prefers-reduced-motion: reduce) { .score-card { animation: none; } }
</style>
