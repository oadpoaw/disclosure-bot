const before = Date.now();

import { clientOptions } from '../config';
import Client from './Client';
import { processor } from '@oadpoaw/utils';
import registerCommands from './loaders/registerCommands';
import registerEvents from './loaders/registerEvents';
import registerPlugins from './loaders/registerPlugins';
import path from 'path';
import Updater from './Updater';
import ms from 'ms';

const client = new Client(clientOptions);

processor(client.logger);

(async function Start() {
	console.log('Loading libraries...');
	client.logger.info(`Starting...`);

	if (await Updater(client)) return;

	await registerCommands(client, path.join(process.cwd(), 'src', 'commands'));
	await registerEvents(client, path.join(process.cwd(), 'src', 'events'));
	await registerPlugins(client);

	client.login(client.config.bot.token).then(() => {
		client.logger.info(`Done! ${ms(Date.now() - before)}`);
	});
})().catch((err) => {
	client.logger.error(err);
	process.exit(1);
});
