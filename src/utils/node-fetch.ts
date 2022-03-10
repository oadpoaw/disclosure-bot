import type { RequestInfo, RequestInit } from 'node-fetch';

/**
 * https://stackoverflow.com/a/69692834
 *
 * Use this instead of importing node-fetch for ESM compatibility
 */
export default async function fetch(
	url: RequestInfo,
	init?: RequestInit | undefined,
) {
	return (await import('node-fetch')).default(url, init);
}
