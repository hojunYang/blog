<script lang="ts">
	import type { Scoreboard as ScoreboardData } from './scoreboard.server';

	let { scores }: { scores: ScoreboardData } = $props();
	const teams = [
		{ id: 'coral', name: 'CORAL', color: 'coral', symbol: '●' },
		{ id: 'sun', name: 'SUN', color: 'sun', symbol: '✦' },
		{ id: 'violet', name: 'VIOLET', color: 'violet', symbol: '◆' },
		{ id: 'mint', name: 'MINT', color: 'mint', symbol: '✚' }
	] as const;
</script>

<div class="score-grid" aria-label="현재 점수">
	{#each teams as team, index}
		<article class="score-card {team.color}" style:--card-index={index}>
			<div class="team-mark" aria-hidden="true">{team.symbol}</div>
			<p>{team.name}</p>
			<strong class:negative={scores[team.id] < 0}>{scores[team.id] > 0 ? '+' : ''}{scores[team.id]}</strong>
		</article>
	{/each}
</div>

<style>
	.score-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(12px, 2vw, 28px); width: min(1420px, 100%); }
	.score-card { min-height: clamp(290px, 43vw, 520px); padding: clamp(22px, 2.2vw, 38px); border-radius: 30px; display: flex; flex-direction: column; justify-content: space-between; color: #17212b; box-shadow: 0 18px 42px rgb(24 31 45 / 14%), inset 0 1px rgb(255 255 255 / 65%); animation: rise .65s calc(var(--card-index) * 90ms) both cubic-bezier(.22,1,.36,1); }
	.coral { background: linear-gradient(145deg, #ffd1c6, #f7988a); }.sun { background: linear-gradient(145deg, #ffe87e, #efae26); }.violet { background: linear-gradient(145deg, #d9cdfc, #9177dd); }.mint { background: linear-gradient(145deg, #bceee0, #55bda7); }
	.team-mark { height: 48px; width: 48px; display: grid; place-items: center; border-radius: 15px; background: rgb(255 255 255 / 42%); font-size: 25px; } p { margin: auto 0 12px; font-family: var(--font-mono); letter-spacing: .1em; font-size: clamp(13px, 1.3vw, 18px); font-weight: 700; } strong { font-family: var(--font-mono); font-size: clamp(68px, 9vw, 146px); letter-spacing: -.09em; line-height: .8; font-variant-numeric: tabular-nums; } strong.negative { color: #7d2442; }
	@keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } } @media (max-width: 760px) { .score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .score-card { min-height: 250px; border-radius: 22px; } } @media (max-width: 420px) { .score-grid { gap: 10px; } .score-card { min-height: 205px; padding: 18px; } } @media (prefers-reduced-motion: reduce) { .score-card { animation: none; } }
</style>
