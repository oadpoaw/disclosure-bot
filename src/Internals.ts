import type Command from './classes/Command';
import Logger from './utils/Logger';
import BotConfig from './loaders/BotConfig';
import type { Plugin } from './structures/Plugin';
import { Client as DiscordClient, Collection, ClientOptions } from 'discord.js';
import type Keyv from 'keyv';

export class Client extends DiscordClient {
	public constructor(options: ClientOptions) {
		super(options);

		this.commands = new Collection();
		this.plugins = new Collection();
		this.logger = Logger;
		this.config = BotConfig();
	}
}

declare module 'discord.js' {
	export interface Client {
		commands: Collection<string, Command>;
		plugins: Collection<string, Plugin>;
		/**
		 * Logger singleton.
		 *
		 * We recommend using this logger instead of console.log to leverage the logging feature
		 */
		logger: typeof Logger;
		config: ReturnType<typeof BotConfig>;
		db: Keyv;
	}
}
