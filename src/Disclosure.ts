import ms from 'ms';
import { Client } from './classes/Client.js';
import { clientOptions } from '../config.js';

if (Number(process.versions.node.split('.')[0]) < 17) {
	throw new Error(`DisclosureBot only supports Node.js 17 and above`);
}

(async function Start() {
	const startingTime = Date.now();

	const client = new Client(clientOptions);

	if (!client.config.sharding) {
		client.once('ready', async () => {
			client.logger.info(
				`[Discord] ${client.user?.tag} / ${client.user?.id}`,
			);

			await client.plugins.initialize();
			await client.dispatcher.initialize();

			client.logger.info(`Done! ${ms(Date.now() - startingTime)}`);
		});

		client.logger.info(`[Discord] Authenticating...`);
	}

	client.login(client.config.token);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
