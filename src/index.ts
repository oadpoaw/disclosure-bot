import Client from './core/Client';
import { processor } from '@oadpoaw/utils';
import { Intents } from 'discord.js';
import BotConfig from './core/loaders/BotConfig';
import registerCommands from './core/loaders/registerCommands';
import registerEvents from './core/loaders/registerEvents';
import path from 'path';
import { checkUpdates, Update } from './core/Updater';

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
});

processor(client.logger);

(async function Start() {
	const config = await BotConfig();

	client.logger.info('[updater] Checking for new software updates...');

	const newVersion = await checkUpdates();
	if (newVersion) {
		client.logger.info(`[updater] Update found: ${newVersion}`);
		if (config.autoUpdates) {
			client.logger.info(
				`[updater] Auto Updates is enabled. Updating to ${newVersion}...`,
			);
			client.logger.info(
				`[updater] Please re-run the program when the update is finished.`,
			);
			Update();
		} else {
			client.logger.info(
				`[updater] Auto Updates is disabled. Not updating...`,
			);
		}
	} else {
		client.logger.info(`[updater] No new software updates found.`);
	}

	await registerEvents(
		client,
		path.join(process.cwd(), 'src', 'core', 'events'),
	);

	await registerCommands(
		client,
		path.join(process.cwd(), 'src', 'core', 'commands'),
	);

	client.login(config.token);
})().catch((err) => {
	client.logger.error(err);
	process.exit(1);
});
