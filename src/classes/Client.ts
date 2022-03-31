import BotConfig from '../loaders/BotConfig.js';
import Dispatcher from './Dispatcher.js';
import Logger from '../utils/Logger.js';
import { Client as DiscordClient, Collection } from 'discord.js';
import type { Plugin } from '../structures/Plugin';
import type { Command } from '../types/PluginTypes';

export class Client extends DiscordClient {
	public readonly commands: Collection<string, Command> = new Collection();

	public readonly plugins: Collection<string, Plugin> = new Collection();

	public readonly logger: typeof Logger = Logger;

	public readonly config = BotConfig();

	public readonly dispatcher: Dispatcher = new Dispatcher(this);
}

declare module 'discord.js' {
	export interface Client {
		/**
		 * - Collection of slash commands.
		 */
		readonly commands: Collection<string, Command>;
		/**
		 * - Collection of Plugins.
		 */
		readonly plugins: Collection<string, Plugin>;

		/**
		 * - The Slash Command Dispatcher.
		 */
		readonly dispatcher: Dispatcher;
		/**
		 * - Logger singleton.
		 *
		 * - We recommend using this logger instead of console.log to leverage and facilitate the logging feature.
		 */
		readonly logger: typeof Logger;
		readonly config: ReturnType<typeof BotConfig>;
	}
}
