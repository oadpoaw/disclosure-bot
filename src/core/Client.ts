import type Command from './structures/Command';
import { Client as DiscordClient, Collection, ClientOptions } from 'discord.js';
import Logger from './utils/Logger';

export default class Client extends DiscordClient {
	public constructor(options: ClientOptions) {
		super(options);

		this.commands = new Collection();
		this.logger = Logger;
	}
}

declare module 'discord.js' {
	export interface Client {
		commands: Collection<string, Command>;
		logger: typeof Logger;
	}
}
