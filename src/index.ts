import Client from './Client';
import { processor } from '@oadpoaw/utils';
import { Intents } from 'discord.js';
import BotConfig from './loaders/BotConfig';
import registerCommands from './loaders/registerCommands';
import registerEvents from './loaders/registerEvents';
import path from 'path';
import { checkUpdates, Update } from './Updater';

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
});

processor(client.logger);

(async function Start() {
	const config = BotConfig();

	client.logger.info('[updater] Checking for software updates...');

	const newVersion = await checkUpdates();
	if (newVersion) {
		client.logger.info(`[updater] Software Update found: ${newVersion}`);
		if (config.autoUpdates) {
			client.logger.info(
				`[updater] Auto Updates is enabled. Updating to ${newVersion}...`,
			);
			client.logger.info(
				`[updater] Please re-run the program when the software update is finished.`,
			);
			Update();
		} else {
			client.logger.info(
				`[updater] Auto Updates is disabled. Not updating...`,
			);
		}
	} else {
		client.logger.info(`[updater] No software updates found.`);
	}

	await registerEvents(client, path.join(process.cwd(), 'src', 'events'));
	await registerCommands(client, path.join(process.cwd(), 'src', 'commands'));

	client.login(config.token);
})().catch((err) => {
	client.logger.error(err);
	process.exit(1);
});
