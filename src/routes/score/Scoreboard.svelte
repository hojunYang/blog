<script lang="ts">
	import { TEAM_IDS } from './teams';
	import type { Scoreboard as ScoreboardData } from './scoreboard.server';
	let { scores }: { scores: ScoreboardData } = $props();
</script>

<div class="score-grid" aria-label="현재 점수">
	{#each TEAM_IDS as team, index}
		<article class="score-card {team}" style:--card-index={index}>
			<p>{scores.names[team]}</p><strong>{scores.scores[team]}</strong>
		</article>
	{/each}
</div>

<style>
	.score-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(12px, 2vw, 28px); width: min(1420px, 100%); }.score-card { position: relative; min-height: clamp(290px, 43vw, 520px); padding: clamp(22px, 2.2vw, 38px); border-radius: 30px; display: grid; place-items: center; color: #fff; box-shadow: 0 18px 42px rgb(24 31 45 / 14%); animation: rise .65s calc(var(--card-index) * 90ms) both cubic-bezier(.22,1,.36,1); }.coral { background: #f5a293; }.sky { background: #56ccf2; }.violet { background: #9f87dd; }.green { background: #6fcf97; }p { position: absolute; top: clamp(26px, 3vw, 46px); margin: 0; max-width: calc(100% - 44px); overflow: hidden; color: #fff; font: 800 clamp(17px, 1.7vw, 25px) var(--font-sans); letter-spacing: -.04em; text-align: center; text-overflow: ellipsis; white-space: nowrap; }strong { font: 800 clamp(88px, 12vw, 184px) / 1 var(--font-sans); letter-spacing: -.1em; font-variant-numeric: tabular-nums; transform: translateX(-10px); }@keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }@media (max-width: 760px) { .score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.score-card { min-height: 250px; border-radius: 22px; } }@media (max-width: 420px) { .score-grid { gap: 10px; }.score-card { min-height: 205px; padding: 18px; } }@media (prefers-reduced-motion: reduce) { .score-card { animation: none; } }
</style>
