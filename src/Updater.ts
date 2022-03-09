import fetch from 'node-fetch';
import Logger from './utils/Logger';
import { version } from '../package.json';
import Config from './Config.json';
import BotConfig from 'loaders/BotConfig';

async function checkUpdates() {
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

export default async function Updater() {
	const config = BotConfig();
	Logger.info('[core] Checking for software updates...');

	const newVersion = await checkUpdates();
	if (newVersion) {
		Logger.info(`[core] Software Update found: ${newVersion}`);
		if (config.autoUpdates) {
			Logger.info(
				`[core] Auto Updates is enabled. Updating to ${newVersion}...`,
			);
			Logger.info(
				`[core] Please re-run the program when the software update is finished.`,
			);
			void import('./scripts/update');

			return true;
		} else {
			Logger.info(`[core] Auto Updates is disabled. Not updating...`);
		}
	} else {
		Logger.info(`[core] No software updates found.`);
	}

	return false;
}
