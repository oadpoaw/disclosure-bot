import Dispatcher from './Dispatcher.js';
import Logger from '../Logger.js';
import yaml from 'yaml';
import z from 'zod';
import { Client as DiscordClient, Collection } from 'discord.js';
import { PluginManager } from './PluginManager.js';
import { readFile } from '@oadpoaw/utils/fs/sync';
import type { Command } from '../types';

const ConfigValidator = z.object({
	token: z.string().nonempty(),
});

function BotConfig(): z.infer<typeof ConfigValidator> {
	return ConfigValidator.parse(
		yaml.parse(readFile(['config.yml']).toString()),
	);
}

export class Client extends DiscordClient {
	public readonly commands: Collection<string, Command> = new Collection();

	public readonly plugins: PluginManager = new PluginManager(this);

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
		readonly config: ReturnType<typeof BotConfig>;
	}
}
