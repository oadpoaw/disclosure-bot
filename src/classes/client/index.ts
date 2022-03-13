import BotConfig from '../../loaders/BotConfig.js';
import Dispatcher from './Dispatcher.js';
import Logger from '../../utils/Logger.js';
import { Client as DiscordClient, ClientOptions, Collection } from 'discord.js';
import type Command from '../plugin/Command.js';
import type Plugin from '../../structures/Plugin.js';
import type { Graph } from '../util/Graph.js';

export class Client extends DiscordClient {
	public constructor(options: ClientOptions) {
		super(options);

		//@ts-ignore
		this.commands = new Collection();
		//@ts-ignore
		this.plugins = new Collection();
		this.logger = Logger;
		this.config = BotConfig();
		//@ts-ignore
		this.dispatcher = new Dispatcher(this);
	}
}

declare module 'discord.js' {
	export interface Client {
		/**
		 * - Collection of slash commands
		 */
		readonly commands: Collection<string, Command>;
		/**
		 * - Collection of Plugins
		 */
		readonly plugins: Collection<string, Plugin>;

		/**
		 * - The dependency graph of the loaded plugins
		 */
		readonly dependencyGraph: Graph;

		/**
		 * - The Slash Command Dispatcher
		 */
		readonly dispatcher: Dispatcher;
		/**
		 * - Logger singleton.
		 *
		 * - We recommend using this logger instead of console.log to leverage the logging feature
		 */
		logger: typeof Logger;
		config: ReturnType<typeof BotConfig>;
	}
}
