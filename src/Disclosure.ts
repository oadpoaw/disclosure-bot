const before = Date.now();
import { Client } from './classes/client/index.js';
import PluginLoader from './loaders/plugin/PluginLoader.js';
import ms from 'ms';
import { clientOptions } from '../config.js';

const client = new Client(clientOptions);

client.once('ready', async () => {
	await client.dispatcher.register();

	if (!client.shard) client.logger.info(`Done! ${ms(Date.now() - before)}`);
});

PluginLoader(client).then(() => client.login(client.config.bot.token));
