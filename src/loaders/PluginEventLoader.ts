import type { Client } from 'discord.js';

export function PluginEventLoader(client: Client<boolean>) {
	for (const [, plugin] of client.plugins) {
		for (const instance of plugin.events) {
			client.on(instance.eventName, async (...args: any) => {
				try {
					await instance.on(client, ...args);
				} catch (error: any) {
					client.logger.error(
						`[events:plugin:${plugin.metadata.name}] ${instance.eventName} - ${plugin.metadata.author}\n${error.stack}`,
					);
				}
			});
		}
	}
}
