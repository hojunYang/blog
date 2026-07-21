import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { error, type RequestHandler } from '@sveltejs/kit';

const POST_IMAGES_DIR = resolve(process.cwd(), 'src/lib/server/content/posts/images');

const MIME_TYPES: Record<string, string> = {
	'.avif': 'image/avif',
	'.gif': 'image/gif',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.pdf': 'application/pdf',
	'.png': 'image/png',
	'.webp': 'image/webp'
};

export const GET: RequestHandler = async ({ params }) => {
	const requestedPath = params.path;
	if (!requestedPath) throw error(404, '파일을 찾을 수 없습니다.');

	const filePath = resolve(POST_IMAGES_DIR, requestedPath);
	const pathFromImagesDirectory = relative(POST_IMAGES_DIR, filePath);
	if (pathFromImagesDirectory.startsWith('..') || isAbsolute(pathFromImagesDirectory)) {
		throw error(404, '파일을 찾을 수 없습니다.');
	}

	const extension = extname(filePath).toLowerCase();
	const contentType = MIME_TYPES[extension];
	if (!contentType) throw error(404, '파일을 찾을 수 없습니다.');

	try {
		const file = await readFile(filePath);
		return new Response(file, {
			headers: {
				'cache-control': 'public, max-age=3600',
				'content-type': contentType
			}
		});
	} catch {
		throw error(404, '파일을 찾을 수 없습니다.');
	}
};
