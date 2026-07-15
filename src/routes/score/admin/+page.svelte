<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { TEAM_IDS, type TeamId } from '../teams';

	let { data }: { data: PageData } = $props();
	let scoreboard = $state(data.scores);
	let isSaving = $state(false);
	let message = $state('');

	onMount(() => {
		const refresh = async () => {
			try { const response = await fetch('/score/api', { cache: 'no-store' }); if (response.ok) scoreboard = await response.json(); }
			catch { /* Keep the last confirmed values. */ }
		};
		const events = new EventSource('/score/events');
		events.addEventListener('scores', refresh);
		return () => events.close();
	});

	async function request(body: Record<string, unknown>) {
		if (isSaving) return;
		isSaving = true;
		try {
			const response = await fetch('/score/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
			if (!response.ok) throw new Error();
			scoreboard = await response.json(); message = '';
		} catch { message = '저장하지 못했습니다. 다시 시도해 주세요.'; }
		finally { isSaving = false; }
	}
	function setLocalName(teamId: TeamId, event: Event) {
		const name = (event.currentTarget as HTMLInputElement).value;
		scoreboard = { ...scoreboard, names: { ...scoreboard.names, [teamId]: name } };
	}
	function saveName(teamId: TeamId) { request({ action: 'rename', teamId, name: scoreboard.names[teamId] }); }
	function reset() { if (confirm('모든 점수를 0점으로 리셋할까요?')) request({ action: 'reset' }); }
</script>

<svelte:head><title>Scoreboard Admin</title></svelte:head>

<section class="admin-page">
	<div class="admin-grid" aria-label="점수 관리">
		{#each TEAM_IDS as team}
			<article class="admin-card {team}">
			
				<button class="arrow up" onclick={() => request({ action: 'change', teamId: team, amount: +1 })} disabled={isSaving} aria-label={`${scoreboard.names[team]} 1점 더하기`}>↑</button>
				<input aria-label="팀 이름" value={scoreboard.names[team]} oninput={(event) => setLocalName(team, event)} onblur={() => saveName(team)} onkeydown={(event) => event.key === 'Enter' && (event.currentTarget as HTMLInputElement).blur()} maxlength="30" />
				<strong>{scoreboard.scores[team]}</strong>
				<button class="arrow down" onclick={() => request({ action: 'change', teamId: team, amount: -1 })} disabled={isSaving} aria-label={`${scoreboard.names[team]} 1점 빼기`}>↓</button>
			</article>
		{/each}
	</div>
	<button class="reset" onclick={reset} disabled={isSaving}>전체 리셋</button>
	<p class="message" aria-live="polite">{message}</p>
</section>

<style>
	.admin-page { position: relative; min-height: 100vh; padding: clamp(26px, 5vw, 72px); display: grid; place-items: center; background: #fff; }.admin-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(12px, 2vw, 28px); width: min(1420px, 100%); }.admin-card { position: relative; min-height: clamp(330px, 43vw, 520px); padding: 26px; border-radius: 30px; color: #fff; box-shadow: 0 18px 42px rgb(24 31 45 / 14%); }.coral { background: #f5a293; }.sky { background: #56ccf2; }.violet { background: #9f87dd; }.green { background: #6fcf97; }input { position: absolute; top: 26px; left: 24px; width: calc(100% - 48px); border: 0; border-bottom: 2px solid rgb(255 255 255 / 52%); border-radius: 0; background: transparent; color: #fff; font: 800 clamp(17px, 1.7vw, 25px) var(--font-sans); letter-spacing: -.04em; text-align: center; outline: none; }input:focus { border-bottom-color: #fff; }strong { position: absolute; top: 56%; left: 50%; font: 800 clamp(88px, 12vw, 184px) / 1 var(--font-sans); letter-spacing: -.1em; font-variant-numeric: tabular-nums; transform: translate(calc(-50% - 10px), -50%); }.arrow { position: absolute; left: 50%; width: 58px; height: 58px; border: 0; border-radius: 50%; background: rgb(255 255 255 / 22%); color: #fff; cursor: pointer; font: 700 36px / 1 var(--font-sans); transform: translateX(-50%); }.arrow:hover { background: rgb(255 255 255 / 36%); }.arrow:not(:disabled):active { transform: translateX(-50%) scale(.97); }.arrow:disabled, .reset:disabled { cursor: wait; opacity: .55; }.up { top: clamp(72px, 8vw, 106px); }.down { bottom: 24px; }.reset { position: absolute; right: clamp(26px, 5vw, 72px); bottom: 20px; border: 0; border-radius: 999px; padding: 10px 15px; background: #f2f3f5; color: #566170; cursor: pointer; font: 700 13px var(--font-sans); }.message { position: absolute; bottom: 20px; left: clamp(26px, 5vw, 72px); margin: 0; color: #b24b4b; font-size: 13px; }@media (max-width: 760px) { .admin-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.admin-card { min-height: 330px; border-radius: 22px; }input { top: 20px; left: 18px; width: calc(100% - 36px); }.arrow { width: 46px; height: 46px; font-size: 29px; }.up { top: 62px; }.down { bottom: 18px; }strong { top: 58%; } }@media (max-width: 420px) { .admin-grid { gap: 10px; }.admin-card { min-height: 330px; padding: 18px; }input { font-size: 15px; } }
</style>
