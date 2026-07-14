import type { PageServerLoad } from './$types';
import { getScores } from '../scoreboard.server';

export const load: PageServerLoad = async () => ({
	scores: await getScores()
});
