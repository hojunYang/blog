import { Pool, type PoolClient } from 'pg';
import { env } from '$env/dynamic/private';

let pool: Pool | null | undefined;

function buildPool(): Pool | null {
	const connectionString = env.DATABASE_URL;
	if (!connectionString) {
		return null;
	}

	const ssl =
		process.env.NODE_ENV === 'production'
			? {
					rejectUnauthorized: false
				}
			: undefined;

	return new Pool({
		connectionString,
		ssl
	});
}

export function getPool(): Pool | null {
	if (pool === undefined) {
		pool = buildPool();
	}
	return pool;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
	const activePool = getPool();
	if (!activePool) {
		throw new Error('DATABASE_URL is not configured');
	}

	const client = await activePool.connect();
	try {
		return await fn(client);
	} finally {
		client.release();
	}
}
