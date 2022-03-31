import type { Client } from 'discord.js';

export function PluginEventLoader(client: Client<boolean>) {
	for (const [, plugin] of client.plugins) {
		for (const [eventName, listener] of plugin.events) {
			client.on(eventName, listener);
		}
	}
}
