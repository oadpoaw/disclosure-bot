import { processor } from '@oadpoaw/utils';
import BotConfig from './loaders/BotConfig.js';
import Updater from './functions/Updater.js';
import Logger from './utils/Logger.js';

processor(Logger);

(async function Start() {
	Logger.info(`Loading libraries...`);

	if (await Updater()) {
		return process.exit(0);
	}

	const config = BotConfig();

	if (config.bot.sharding) {
		return import('./DisclosureSharding.js');
	} else {
		return import('./Disclosure.js');
	}
})().catch((err) => {
	Logger.error(err);
	process.exit(1);
});
