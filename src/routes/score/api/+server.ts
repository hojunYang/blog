import { error, json, type RequestHandler } from '@sveltejs/kit';
import { ensureSameOrigin } from '$lib/server/metrics';
import { changeScore, getScores, renameTeam, resetScores } from '../scoreboard.server';

export const GET: RequestHandler = async () => {
	try {
		return json(await getScores());
	} catch {
		throw error(503, '점수판 데이터베이스에 연결할 수 없습니다.');
	}
};

export const POST: RequestHandler = async (event) => {
	ensureSameOrigin(event);
	try {
		const body = await event.request.json();
		if (body?.action === 'reset') return json(await resetScores());
		if (body?.action === 'change') return json(await changeScore(body.teamId, body.amount));
		if (body?.action === 'rename') return json(await renameTeam(body.teamId, body.name));
		throw error(400, '잘못된 요청입니다.');
	} catch (cause) {
		if (cause && typeof cause === 'object' && 'status' in cause) throw cause;
		throw error(400, '점수를 변경할 수 없습니다.');
	}
};
