export type Scoreboard = Record<string, number>;

const INITIAL_SCORES: Scoreboard = {
	coral: 0,
	sky: 0,
	violet: 0,
	green: 0
};

// This module is evaluated once per SvelteKit server process, so the values are
// shared by every visitor and survive page refreshes. They reset on a restart/deploy.
let scores: Scoreboard = { ...INITIAL_SCORES };

export async function getScores(): Promise<Scoreboard> {
	return { ...scores };
}

export async function changeScore(teamId: string, amount: number): Promise<Scoreboard> {
	if (!(teamId in INITIAL_SCORES) || !Number.isSafeInteger(amount) || amount === 0) throw new Error('Invalid score update');
	scores = { ...scores, [teamId]: scores[teamId] + amount };
	return getScores();
}

export async function resetScores(): Promise<Scoreboard> {
	scores = { ...INITIAL_SCORES };
	return getScores();
}
