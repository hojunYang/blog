import { getPool, withClient } from '$lib/server/db';

export type Scoreboard = Record<string, number>;

const INITIAL_SCORES: Scoreboard = {
	coral: 0,
	sun: 0,
	violet: 0,
	mint: 0
};

const schema = `
	CREATE TABLE IF NOT EXISTS scoreboard_scores (
		team_id TEXT PRIMARY KEY,
		score INTEGER NOT NULL DEFAULT 0,
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)
`;

async function ensureScoreboard(): Promise<void> {
	await withClient(async (client) => {
		await client.query(schema);
		for (const [teamId, score] of Object.entries(INITIAL_SCORES)) {
			await client.query(
				'INSERT INTO scoreboard_scores (team_id, score) VALUES ($1, $2) ON CONFLICT (team_id) DO NOTHING',
				[teamId, score]
			);
		}
	});
}

export async function getScores(): Promise<Scoreboard> {
	if (!getPool()) throw new Error('DATABASE_URL is not configured');
	await ensureScoreboard();
	return withClient(async (client) => {
		const result = await client.query<{ team_id: string; score: number }>('SELECT team_id, score FROM scoreboard_scores');
		const scores = { ...INITIAL_SCORES };
		for (const row of result.rows) if (row.team_id in scores) scores[row.team_id] = Number(row.score);
		return scores;
	});
}

export async function changeScore(teamId: string, amount: number): Promise<Scoreboard> {
	if (!(teamId in INITIAL_SCORES) || !Number.isSafeInteger(amount) || amount === 0) throw new Error('Invalid score update');
	if (!getPool()) throw new Error('DATABASE_URL is not configured');
	await ensureScoreboard();
	await withClient((client) => client.query('UPDATE scoreboard_scores SET score = score + $2, updated_at = NOW() WHERE team_id = $1', [teamId, amount]));
	return getScores();
}

export async function resetScores(): Promise<Scoreboard> {
	if (!getPool()) throw new Error('DATABASE_URL is not configured');
	await ensureScoreboard();
	await withClient((client) => client.query('UPDATE scoreboard_scores SET score = 0, updated_at = NOW()'));
	return getScores();
}
