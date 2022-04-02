import fetch from 'node-fetch';
import packageJSON from '../package.json';
import { Config } from "./Config.js";
import Logger from './Logger.js';

if (Number(process.versions.node.split('.')[0]) < 17) {
	throw new Error(`DisclosureBot only supports Node.js 17 and above`);
}

(async function Start() {
	Logger.info(`Running on v${packageJSON.version}`);

	Logger.info('[Updater] Checking for software updates...');

	const response = await fetch(
		`https://api.github.com/repos/${packageJSON.author}/${packageJSON.name}/releases/latest`,
	);

	const json = (await response.json()) as { tag_name: string };

	const newVersion = json.tag_name;

	if (`v${packageJSON.version}` !== newVersion) {
		Logger.info(`[Updater] Software Update found: ${newVersion}`);
		Logger.info(
			`[Updater] You can now run the command 'npm run upgrade' to update the bot to get the latest features and bug fixes!`,
		);
		Logger.info(
			`Changelogs: https://github.com/oadpoaw/disclosure-bot/blob/main/CHANGELOG.md`,
		);
	} else {
		Logger.info(`[Updater] No software updates found.`);
	}

	if (Config.sharding) {
		await import('./Sharding.js');
	} else {
		await import('./Disclosure.js');
	}
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
