if (Number(process.versions.node.split('.')[0]) < 17) {
	throw new Error(`DisclosureBot only supports Node.js 17 and above`);
}

import setTerminalTitle from './functions/setTerminalTitle.js';
import BotConfig from './loaders/BotConfig.js';
import Logger from './utils/Logger.js';
import Updater from './functions/Updater.js';
import { processor } from '@oadpoaw/utils';

setTerminalTitle('Disclosure Bot');

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
