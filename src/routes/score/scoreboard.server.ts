import { getPool, withClient } from '$lib/server/db';
import type { PoolClient } from 'pg';
import { TEAM_IDS, type TeamId } from './teams';

export { TEAM_IDS, type TeamId } from './teams';
export type Scoreboard = { scores: Record<TeamId, number>; names: Record<TeamId, string> };

const INITIAL_TEAMS: Record<TeamId, { name: string; score: number }> = {
	coral: { name: '팀 1', score: 0 }, sky: { name: '팀 2', score: 0 }, violet: { name: '팀 3', score: 0 }, green: { name: '팀 4', score: 0 }
};
const SCORE_CHANGE_CHANNEL = 'scoreboard_changes';
const subscribers = new Set<() => void>();
let listenerClient: PoolClient | null = null;
let listenerPromise: Promise<void> | null = null;

function isTeamId(teamId: string): teamId is TeamId { return TEAM_IDS.includes(teamId as TeamId); }

async function startChangeListener(): Promise<void> {
	if (listenerClient) return;
	if (listenerPromise) return listenerPromise;
	const pool = getPool();
	if (!pool) throw new Error('DATABASE_URL is not configured');
	listenerPromise = (async () => {
		const client = await pool.connect();
		client.on('notification', (message) => { if (message.channel === SCORE_CHANGE_CHANNEL) for (const subscriber of subscribers) subscriber(); });
		client.on('error', () => { listenerClient = null; listenerPromise = null; });
		await client.query(`LISTEN ${SCORE_CHANGE_CHANNEL}`);
		listenerClient = client;
	})();
	try { await listenerPromise; } catch (error) { listenerPromise = null; throw error; }
}

async function ensureScoreboard(): Promise<void> {
	if (!getPool()) throw new Error('DATABASE_URL is not configured');
	await withClient(async (client) => {
		await client.query(`CREATE TABLE IF NOT EXISTS scoreboard_scores (team_id TEXT PRIMARY KEY, score INTEGER NOT NULL DEFAULT 0, team_name VARCHAR(30) NOT NULL DEFAULT '', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
		await client.query("ALTER TABLE scoreboard_scores ADD COLUMN IF NOT EXISTS team_name VARCHAR(30) NOT NULL DEFAULT ''");
		for (const [teamId, team] of Object.entries(INITIAL_TEAMS)) {
			await client.query('INSERT INTO scoreboard_scores (team_id, score, team_name) VALUES ($1, $2, $3) ON CONFLICT (team_id) DO NOTHING', [teamId, team.score, team.name]);
			await client.query("UPDATE scoreboard_scores SET team_name = $2 WHERE team_id = $1 AND btrim(team_name) = ''", [teamId, team.name]);
		}
	});
}

async function notifyScoreChange(client: PoolClient, event: string): Promise<void> {
	await client.query(`SELECT pg_notify('${SCORE_CHANGE_CHANNEL}', $1)`, [event]);
}

export async function getScores(): Promise<Scoreboard> {
	await ensureScoreboard();
	return withClient(async (client) => {
		const result = await client.query<{ team_id: string; score: number; team_name: string }>('SELECT team_id, score, team_name FROM scoreboard_scores');
		const scoreboard: Scoreboard = { scores: {} as Scoreboard['scores'], names: {} as Scoreboard['names'] };
		for (const id of TEAM_IDS) { scoreboard.scores[id] = INITIAL_TEAMS[id].score; scoreboard.names[id] = INITIAL_TEAMS[id].name; }
		for (const row of result.rows) if (isTeamId(row.team_id)) { scoreboard.scores[row.team_id] = Number(row.score); scoreboard.names[row.team_id] = row.team_name; }
		return scoreboard;
	});
}

export async function changeScore(teamId: string, amount: number): Promise<Scoreboard> {
	if (!isTeamId(teamId) || !Number.isSafeInteger(amount) || amount === 0) throw new Error('Invalid score update');
	await ensureScoreboard();
	await withClient(async (client) => { await client.query('UPDATE scoreboard_scores SET score = score + $2, updated_at = NOW() WHERE team_id = $1', [teamId, amount]); await notifyScoreChange(client, 'score'); });
	return getScores();
}

export async function renameTeam(teamId: string, name: unknown): Promise<Scoreboard> {
	if (!isTeamId(teamId) || typeof name !== 'string') throw new Error('Invalid team name');
	const trimmedName = name.trim();
	if (!trimmedName || trimmedName.length > 30) throw new Error('Invalid team name');
	await ensureScoreboard();
	await withClient(async (client) => { await client.query('UPDATE scoreboard_scores SET team_name = $2, updated_at = NOW() WHERE team_id = $1', [teamId, trimmedName]); await notifyScoreChange(client, 'name'); });
	return getScores();
}

export async function resetScores(): Promise<Scoreboard> {
	await ensureScoreboard();
	await withClient(async (client) => { await client.query('UPDATE scoreboard_scores SET score = 0, updated_at = NOW()'); await notifyScoreChange(client, 'reset'); });
	return getScores();
}

export async function subscribeToScoreChanges(subscriber: () => void): Promise<() => void> {
	await startChangeListener(); subscribers.add(subscriber); return () => subscribers.delete(subscriber);
}
