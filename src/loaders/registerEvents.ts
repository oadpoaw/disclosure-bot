import path from 'path';
import DiscordEvent from '../structures/DiscordEvent';
import type { Client } from 'discord.js';
import { readdir } from '../utils/FileSystem';

export default async function registerEvents(client: Client) {
	const files = readdir('src', 'events').filter((e) => e.endsWith('.ts'));

	for (const eventFile of files) {
		try {
			const eventPath = path.join(
				process.cwd(),
				'src',
				'events',
				eventFile,
			);
			const instance = (await import(eventPath))
				.default as DiscordEvent<any>;

			if (instance instanceof DiscordEvent) {
				if (typeof instance.on === 'function') {
					client.on(instance.eventName, async (...args: any) => {
						if (typeof instance.on === 'function') {
							try {
								await instance.on(client, ...args);
							} catch (error) {
								client.logger.error(
									`[events:on] ${instance.eventName}`,
								);
								client.logger.error(error);
							}
						}
					});
				}
				if (typeof instance.once === 'function') {
					client.once(instance.eventName, async (...args: any) => {
						if (typeof instance.once === 'function') {
							try {
								await instance.once(client, ...args);
							} catch (error) {
								client.logger
									.error(
										`[events:once] ${instance.eventName}`,
									)
									.error(error);
							}
						}
					});
				}
			}

			delete require.cache[require.resolve(eventPath)];
		} catch (error) {
			client.logger
				.error(`[events] error loading '${eventFile}'`)
				.error(error);
			process.exit(1);
		}
	}
}
