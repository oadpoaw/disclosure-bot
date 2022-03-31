if (Number(process.versions.node.split('.')[0]) < 17) {
	throw new Error(`DisclosureBot only supports Node.js 17 and above`);
}

import checkUpdates from './functions/checkUpdates.js';
import Logger from './utils/Logger.js';
import ms from 'ms';
import PluginLoader from './loaders/PluginLoader.js';
import setTerminalTitle from './utils/setTerminalTitle.js';
import { Client } from './classes/Client.js';
import { clientOptions } from '../config.js';
import { processor } from '@oadpoaw/utils';

const before = Date.now();

processor(Logger);

(async function Start() {
	Logger.info(`Loading...`);

	await checkUpdates();

	const client = new Client(clientOptions);

	client.once('ready', async () => {
		client.logger.info(
			`Authenticated as ${client.user?.tag} ${client.user?.id}`,
		);

		await client.dispatcher.load();

		client.logger.info(`Done! ${ms(Date.now() - before)}`);

		setTerminalTitle(client.user?.tag || '');
	});

	PluginLoader(client).then(() => {
		client.logger.info(`Authenticating...`);

		client.login(client.config.token);
	});
})().catch((err) => {
	Logger.error(err);
	process.exit(1);
});
