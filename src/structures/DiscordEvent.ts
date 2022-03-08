import type { Client, ClientEvents } from 'discord.js';

type Listener<K extends keyof ClientEvents> = (
	client: Client,
	...args: ClientEvents[K]
) => any;

export default class DiscordEvent<K extends keyof ClientEvents> {
	public constructor(
		public readonly eventName: K,
		public readonly on?: Listener<K>,
		public readonly once?: Listener<K>,
	) {}
}
