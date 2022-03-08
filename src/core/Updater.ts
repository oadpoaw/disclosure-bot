import fetch from 'node-fetch';
import { version } from '../../package.json';
import Config from './Config.json';

export async function checkUpdates() {
	const response = await fetch(
		`https://api.github.com/repos/${Config.owner}/${Config.repository}/releases/latest`,
	);
	const json = (await response.json()) as { tag_name: string };

	const newVersion = json.tag_name;

	if (`v${version}` !== newVersion) {
		return newVersion;
	}

	return false;
}

export async function Update() {
	import('./scripts/update');
}
