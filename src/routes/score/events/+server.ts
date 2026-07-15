import type { RequestHandler } from './$types';
import { subscribeToScoreChanges } from '../scoreboard.server';

const encoder = new TextEncoder();

export const GET: RequestHandler = async () => {
	let unsubscribe = () => {};
	let heartbeat: ReturnType<typeof setInterval> | undefined;

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const send = (event: string, data = '') => {
				try {
					controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
				} catch {
					// The browser closed the stream.
				}
			};

			send('connected');
			try {
				unsubscribe = await subscribeToScoreChanges(() => send('scores'));
			} catch {
				send('error', 'database connection failed');
			}
			heartbeat = setInterval(() => send('ping'), 25_000);
		},
		cancel() {
			unsubscribe();
			if (heartbeat) clearInterval(heartbeat);
		}
	});

	return new Response(stream, {
		headers: {
			'cache-control': 'no-cache, no-transform',
			'content-type': 'text/event-stream',
			connection: 'keep-alive'
		}
	});
};
