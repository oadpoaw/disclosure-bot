import { Client } from './classes/client/index.js';
import PluginLoader from './loaders/plugin/PluginLoader.js';
import ms from 'ms';
import { clientOptions } from '../config.js';
import setTerminalTitle from './functions/setTerminalTitle.js';

const before = Date.now();
const client = new Client(clientOptions);

client.once('ready', async () => {
	client.logger.info(`Authenticated.`);
	await client.dispatcher.load();

	client.logger.info(`Done! ${ms(Date.now() - before)}`);

	setTerminalTitle(client.user?.tag || '');
});

PluginLoader(client).then(() => {
	client.logger.info(`Authenticating...`);

	client.login(client.config.token);
});
