import { exec } from 'child_process';
import type { Client, ClientEvents } from 'discord.js';
import { promisify } from 'util';
import {
	existsDirectory,
	existsFile,
	mkdir,
	readFile,
	writeFile,
} from '../utils/FileSystem';
import yaml from 'yaml';
import Command from '../classes/Command';
import DiscordEvent, { Listener } from '../classes/DiscordEvent';

const execute = promisify(exec);

export interface PluginMetaData {
	/**
	 * Name of the plugin
	 *
	 * Should be alpnanumeric and it should not contain any spaces or special characters
	 */
	name: string;
	/**
	 * Description of the plugin
	 */
	description: string;
	/**
	 * Version of the plugin
	 *
	 * Ex. `1.2.3`
	 */
	version: string;
	/**
	 * Author of the plugin
	 *
	 * Ex. `undefine <oadpoaw@gmail.com>`
	 */
	author: string;
	/**
	 * Extra plugin dependencies for this plugin.
	 * If provided, then this plugin will not be loaded if the specified plugin dependencies is not installed.
	 *
	 * This should be a valid plugin name and it's CaSe-SeNsItIvE
	 *
	 * Ex.
	 * ```js
	 * pluginDependencies: ['Economy', 'TicketP@1.3.4']
	 * ```
	 *
	 * You can include the plugin's version by appending `@` then the plugin's version
	 */
	dependencies: string[];
	/**
	 * Same as property 'dependencies' but optional. Kinda like plug n play plugins
	 */
	optionalDependencies: string[];
	/**
	 * Priority of the plugin. The higher the value the higher the priority when loading this plugin.
	 * Ex.
	 * If Plugin A's priority is greater than Plugin B's priority
	 * then Plugin A will be the first plugin to be loaded and initialized.
	 * @default 1
	 *
	 */
	/**
	 * Extra NPM dependencies for this plugin.
	 *
	 * Ex.
	 * ```js
	 * dependencies: ['is-plain-object', 'lodash', 'fakePackageLol@1.2.3']
	 * ```
	 *
	 * Note: This won't be save in package.json
	 */
	npmDependencies: string[];
	priority?: number;
}

export default interface PluginInterface {
	/**
	 * Called when this plugin is loaded
	 */
	onLoad(): void | Promise<void>;

	/**
	 * Called when this plugin is reloaded
	 */
	onReload(): void | Promise<void>;
}

export default abstract class Plugin implements Partial<PluginInterface> {
	private _cfg: Record<any, any> | null;
	private _commands: Command[];
	private _events: DiscordEvent<any>[];

	public static Command = Command;

	protected readonly client: Client;

	public constructor(client: Client) {
		this.client = client;
		this._cfg = null;
		this._commands = [];
		this._events = [];
	}

	/**
	 * Get the plugin's metadata
	 */
	abstract readonly metadata: PluginMetaData;

	/**
	 * Get the plugin's default configuration for plugins/[plugin-name]/config.yml
	 */
	abstract getDefaultConfig(): Record<any, any>;

	/**
	 * Add a command that is assigned to this plugin
	 * @param args
	 */
	protected addCommand(...args: ConstructorParameters<typeof Command>) {
		this._commands.push(new Command(...args));
	}

	/**
	 * Add an event listener that is assigned to this plugin
	 */
	protected listen<K extends keyof ClientEvents>(event: K, fn: Listener<K>) {
		this._events.push(new DiscordEvent(event, fn));
	}

	public get commands() {
		return this._commands;
	}

	public get events() {
		return this._events;
	}

	/**
	 * Initialize the plugin
	 */
	public async init() {
		const pluginFolder = ['plugins', this.metadata.name];

		if (!existsDirectory(pluginFolder)) mkdir(pluginFolder);

		this.getConfig();

		await this.install();
		if (typeof this.onLoad === 'function') await this.onLoad();
	}

	/**
	 * Set config for plugins/[plugin-name]/config.yml
	 * @param cfg
	 */
	public setConfig(cfg: Record<any, any>) {
		const str = yaml.stringify(cfg);

		writeFile(['plugins', this.metadata.name, 'config.yml'], str);
		this._cfg = cfg;

		return cfg;
	}

	/**
	 * Get the config for plugins/[plugin-name]/config.yml
	 * @param force Forcefully get the config from plugins/[plugin-name]/config.yml
	 * @returns
	 */
	public getConfig(force = false): Record<any, any> {
		if (this._cfg && !force) return this._cfg;

		const filePath = ['plugins', this.metadata.name, 'config.yml'];

		if (!existsFile(filePath)) {
			return this.setConfig(this.getDefaultConfig());
		} else {
			const buffer = readFile(filePath);
			const b = yaml.parse(buffer.toString());
			this._cfg = b;
			return b;
		}
	}

	/**
	 * Install the plugin's dependencies
	 */
	public async install() {
		if (this.metadata.npmDependencies.length) {
			const { stderr } = await execute(
				`npm install --no-save ${this.metadata.npmDependencies.join(
					' ',
				)}`,
			);

			if (stderr) throw new Error(stderr);
		}
	}

	/**
	 * Reload plugin's configuration from it's config.yml
	 * - includes reinstalling dependencies listed in the config.yml
	 */
	public async reload() {
		this.getConfig(true);
		await this.install();

		if (typeof this.onReload === 'function') await this.onReload();
	}
}
