import 'module-alias/register';
import { processor } from '@oadpoaw/utils';
import BotConfig from './loaders/BotConfig';
import Updater from './functions/Updater';
import Logger from './utils/Logger';

processor(Logger);

(async function Start() {
	Logger.info(`Loading libraries...`);

	if (await Updater()) {
		return process.exit(0);
	}

	const config = BotConfig();

	if (config.bot.sharding) {
		return import('./DisclosureSharding');
	} else {
		return import('./Disclosure');
	}
})().catch((err) => {
	Logger.error(err);
	process.exit(1);
});
