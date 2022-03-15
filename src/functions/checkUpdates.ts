import fetch from 'node-fetch';
import Logger from '../utils/Logger.js';
import packageJSON from '../../package.json';

export default async function checkUpdates() {
	Logger.info('[core] Checking for new software updates...');
	const response = await fetch(
		`https://api.github.com/repos/${packageJSON.author}/${packageJSON.name}/releases/latest`,
	);
	const json = (await response.json()) as { tag_name: string };

	const newVersion = json.tag_name;

	if (`v${packageJSON.version}` !== newVersion) {
		Logger.info(`[core] New Software Update found: ${newVersion}`);
		Logger.info(
			`[core] You can now please run the command 'npm run upgrade' to update the bot to get the latest features and bug fixes!`,
		);
	}
}
