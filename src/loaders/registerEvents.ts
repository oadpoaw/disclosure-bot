import path from 'path';
import fs from 'fs/promises';
import DiscordEvent from '../structures/DiscordEvent';
import type { Client } from 'discord.js';

export default async function registerEvents(client: Client, filePath: string) {
	const files = await fs.readdir(filePath);

	for (const eventFile of files) {
		if (eventFile.endsWith('.ts')) {
			try {
				const eventPath = path.join(filePath, eventFile);
				const instance = (await import(eventPath))
					.default as DiscordEvent<any>;

				if (instance instanceof DiscordEvent) {
					client.logger.info(
						`[events] Loading '${instance.eventName}'`,
					);
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
						client.once(
							instance.eventName,
							async (...args: any) => {
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
							},
						);
					}
				}

				delete require.cache[require.resolve(eventPath)];
			} catch (error) {
				client.logger
					.error(`[events] loading '${eventFile}'`)
					.error(error);
				process.exit(1);
			}
		}
	}
}
