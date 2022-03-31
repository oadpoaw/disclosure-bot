if (Number(process.versions.node.split('.')[0]) < 17) {
	throw new Error(`DisclosureBot only supports Node.js 17 and above`);
}

import setTerminalTitle from './functions/setTerminalTitle.js';
import Logger from './utils/Logger.js';
import checkUpdates from './functions/checkUpdates.js';
import { processor } from '@oadpoaw/utils';

setTerminalTitle('Loading...');

processor(Logger);

(async function Start() {
	Logger.info(`Loading libraries...`);

	await checkUpdates();

	import('./Disclosure.js');
})().catch((err) => {
	Logger.error(err);
	process.exit(1);
});
