import type { Client } from 'discord.js';
import fetch from 'node-fetch';
import { version } from '../package.json';
import Config from './Config.json';

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

export default async function Updater(client: Client) {
	client.logger.info('[core] Checking for software updates...');

	const newVersion = await checkUpdates();
	if (newVersion) {
		client.logger.info(`[core] Software Update found: ${newVersion}`);
		if (client.config.autoUpdates) {
			client.logger.info(
				`[core] Auto Updates is enabled. Updating to ${newVersion}...`,
			);
			client.logger.info(
				`[core] Please re-run the program when the software update is finished.`,
			);
			void import('./scripts/update');

			return true;
		} else {
			client.logger.info(
				`[core] Auto Updates is disabled. Not updating...`,
			);
		}
	} else {
		client.logger.info(`[core] No software updates found.`);
	}

	return false;
}
