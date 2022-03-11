const before = Date.now();
import 'module-alias/register';
import Config from './config';
import { Client } from './Internals';
import PluginLoader from './loaders/PluginLoader';
import ms from 'ms';

const client = new Client(Config().clientOptions);

client.once('ready', Ready);

async function Ready() {
	await client.dispatcher.register();

	if (!client.shard) client.logger.info(`Done! ${ms(Date.now() - before)}`);
}

PluginLoader(client).then(() => client.login(client.config.bot.token));
