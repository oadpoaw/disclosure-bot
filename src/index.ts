import { processor } from '@oadpoaw/utils';
import BotConfig from 'loaders/BotConfig';
import Updater from './Updater';
import Logger from './utils/Logger';

processor(Logger);

(async function Start() {
	Logger.info(`Loading libraries...`);
	if (await Updater()) return;

	const config = BotConfig();

	if (config.bot.sharding) void import('./Shard');
	else void import('./Bot');
})().catch((err) => {
	Logger.error(err);
	process.exit(1);
});
