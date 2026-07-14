<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let scores = $state(data.scores);
	let customAmount = $state(5);
	let isSaving = $state(false);
	let message = $state('');

	const teams = [
		{ id: 'coral', name: 'CORAL', color: 'coral' },
		{ id: 'sky', name: 'SKY', color: 'sky' },
		{ id: 'violet', name: 'VIOLET', color: 'violet' },
		{ id: 'green', name: 'GREEN', color: 'green' }
	] as const;

	async function update(teamId: string, amount: number) {
		if (!Number.isSafeInteger(amount) || amount === 0 || isSaving) return;
		isSaving = true;
		message = '';
		try {
			const response = await fetch('/score/api', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ action: 'change', teamId, amount })
			});
			if (!response.ok) throw new Error();
			scores = await response.json();
			message = `${teams.find((team) => team.id === teamId)?.name} ${amount > 0 ? '+' : ''}${amount}`;
		} catch { message = '저장하지 못했습니다. 다시 시도해 주세요.'; }
		finally { isSaving = false; }
	}

	async function reset() {
		if (isSaving || !confirm('모든 점수를 0점으로 리셋할까요?')) return;
		isSaving = true;
		message = '';
		try {
			const response = await fetch('/score/api', {
				method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'reset' })
			});
			if (!response.ok) throw new Error();
			scores = await response.json();
			message = '모든 점수를 0점으로 리셋했습니다.';
		} catch { message = '리셋하지 못했습니다. 다시 시도해 주세요.'; }
		finally { isSaving = false; }
	}
</script>

<svelte:head><title>Scoreboard Admin</title></svelte:head>

<section class="admin-page">
	<section class="controls" aria-label="점수 조절">
		<div class="control-heading">
			<div><p class="eyebrow">QUICK ACTIONS</p><h2>팀별 점수 조절</h2></div>
			<label>변경 점수 <input type="number" min="1" step="1" bind:value={customAmount} /></label>
		</div>
		<div class="team-controls">
			{#each teams as team}
				<div class="team-control {team.color}">
					<strong>{team.name}</strong>
					<span>{scores[team.id] > 0 ? '+' : ''}{scores[team.id]}</span>
					<div class="buttons">
						<button onclick={() => update(team.id, -1)} disabled={isSaving} aria-label={`${team.name} 1점 빼기`}>−1</button>
						<button onclick={() => update(team.id, 1)} disabled={isSaving} aria-label={`${team.name} 1점 더하기`}>+1</button>
						<button class="custom" onclick={() => update(team.id, -Math.abs(customAmount))} disabled={isSaving || !customAmount}>−{Math.abs(customAmount || 0)}</button>
						<button class="custom primary" onclick={() => update(team.id, Math.abs(customAmount))} disabled={isSaving || !customAmount}>+{Math.abs(customAmount || 0)}</button>
					</div>
				</div>
			{/each}
		</div>
		<div class="admin-footer"><p aria-live="polite">{message}</p><button class="reset" onclick={reset} disabled={isSaving}>전체 리셋</button></div>
	</section>
</section>

<style>
	.admin-page { min-height: 100vh; padding: clamp(26px, 5vw, 72px); display: grid; place-items: center; background: radial-gradient(circle at 5% 0%, #fff0dc, transparent 27%), radial-gradient(circle at 95% 100%, #d8f4ef, transparent 30%), #f7f8fc; }
	.controls { width: min(1420px, 100%); padding: clamp(22px, 3vw, 42px); border: 1px solid #e4e8ee; border-radius: 28px; background: rgb(255 255 255 / 76%); box-shadow: 0 20px 50px rgb(44 51 70 / 8%); } .eyebrow { margin: 0 0 10px; color: #6c7586; font: 700 12px var(--font-mono); letter-spacing: .14em; } h2 { margin: 0; color: #17212b; letter-spacing: -.06em; font-size: clamp(24px, 3vw, 36px); } .control-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 26px; } label { color: #566170; font: 700 12px var(--font-mono); letter-spacing: .06em; } input { display: block; width: 108px; margin-top: 8px; padding: 10px 12px; border: 1px solid #d5dbe3; border-radius: 10px; background: white; color: #17212b; font-weight: 700; }
	.team-controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; } .team-control { padding: 18px; border-radius: 18px; color: #17212b; } .team-control.coral { background: #ffded7; } .team-control.sky { background: #d9f4fd; } .team-control.violet { background: #e5ddff; } .team-control.green { background: #d8f5e4; } .team-control > strong { display: block; font: 800 14px var(--font-mono); letter-spacing: .08em; } .team-control > span { display: block; margin: 22px 0 18px; font: 800 36px var(--font-mono); letter-spacing: -.08em; font-variant-numeric: tabular-nums; } .buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .buttons button, .reset { min-height: 42px; border: 0; border-radius: 10px; background: rgb(255 255 255 / 62%); color: #25313d; font: 800 13px var(--font-mono); cursor: pointer; } .buttons button.primary { background: #17212b; color: white; } button:disabled { cursor: wait; opacity: .48; } .admin-footer { display: flex; min-height: 46px; justify-content: space-between; align-items: center; gap: 16px; margin-top: 26px; } .admin-footer p { margin: 0; color: #5b6674; font-size: 14px; } .reset { padding-inline: 18px; background: #fff0ed; color: #aa3d35; }
	@media (max-width: 900px) { .team-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 520px) { .control-heading { align-items: start; flex-direction: column; } .team-controls { grid-template-columns: 1fr; } .admin-footer { align-items: stretch; flex-direction: column; } .reset { min-height: 46px; } }
</style>
