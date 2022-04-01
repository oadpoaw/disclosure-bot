import fetch from 'node-fetch';
import ms from 'ms';
import packageJSON from '../package.json';
import { Client } from './classes/Client.js';
import { clientOptions } from '../config.js';

if (Number(process.versions.node.split('.')[0]) < 17) {
	throw new Error(`DisclosureBot only supports Node.js 17 and above`);
}

(async function Start() {
	const startingTime = Date.now();

	const client = new Client(clientOptions);

	client.logger.info(`Running on v${packageJSON.version}`);

	client.logger.info('[Updater] Checking for software updates...');

	const response = await fetch(
		`https://api.github.com/repos/${packageJSON.author}/${packageJSON.name}/releases/latest`,
	);

	const json = (await response.json()) as { tag_name: string };

	const newVersion = json.tag_name;

	if (`v${packageJSON.version}` !== newVersion) {
		client.logger.info(`[Updater] Software Update found: ${newVersion}`);
		client.logger.info(
			`[Updater] You can now run the command 'npm run upgrade' to update the bot to get the latest features and bug fixes!`,
		);
		client.logger.info(
			`Changelogs: https://github.com/oadpoaw/disclosure-bot/blob/main/CHANGELOG.md`,
		);
	} else {
		client.logger.info(`[Updater] No software updates found.`);
	}

	client.once('ready', async () => {
		client.logger.info(
			`[Discord] ${client.user?.tag} / ${client.user?.id}`,
		);

		await client.dispatcher.initialize();

		client.logger.info(`Done! ${ms(Date.now() - startingTime)}`);
	});

	await client.plugins.initialize();

	client.logger.info(`[Discord] Authenticating...`);

	client.login(client.config.token);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
