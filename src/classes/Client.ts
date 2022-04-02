import Dispatcher from './Dispatcher.js';
import Logger from '../Logger.js';
import { Client as DiscordClient, Collection } from 'discord.js';
import { PluginManager } from './PluginManager.js';
import type { Command } from '../types';
import { Config, BotConfig } from '../Config.js';

export class Client extends DiscordClient {
	public readonly commands: Collection<string, Command> = new Collection();

	public readonly plugins: PluginManager = new PluginManager(this);

	public readonly logger: typeof Logger = Logger;

	public readonly config = Config;

	public readonly dispatcher: Dispatcher = new Dispatcher(
		<DiscordClient<true>>this,
	);
}

declare module 'discord.js' {
	export interface Client {
		/**
		 * - Collection of slash commands.
		 */
		readonly commands: Collection<string, Command>;
		/**
		 * - PluginManager.
		 */
		readonly plugins: PluginManager;

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
		/**
		 * - The configuration of the bot which is defined in bot's `config.yml`
		 */
		readonly config: ReturnType<typeof BotConfig>;
	}
}
