const before = Date.now();
import 'module-alias/register';
import Config from './functions/config';
import { Client } from './classes/client';
import PluginLoader from './loaders/plugin/PluginLoader';
import ms from 'ms';

const client = new Client(Config().clientOptions);

client.once('ready', async () => {
	await client.dispatcher.register();

	if (!client.shard) client.logger.info(`Done! ${ms(Date.now() - before)}`);
});

PluginLoader(client).then(() => client.login(client.config.bot.token));
