import { Client } from './classes/client/index.js';
import PluginLoader from './loaders/plugin/PluginLoader.js';
import ms from 'ms';
import { clientOptions } from '../config.js';

const before = Date.now();
const client = new Client(clientOptions);

client.once('ready', async () => {
	client.logger.info(`Authenticated.`);
	await client.dispatcher.load();

	if (!client.shard) {
		client.logger.info(`Done! ${ms(Date.now() - before)}`);
	}
});

PluginLoader(client).then(() => {
	client.logger.info(`Authenticating...`);

	client.login(client.config.bot.token);
});
