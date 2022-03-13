import DisclosureError from '../classes/DisclosureError.js';
import DiscordEvent, { Listener } from '../classes/plugin/DiscordEvent.js';
import yaml from 'yaml';
import { exec } from 'child_process';
import { Inhibitor, InhibitorFunction } from '../classes/plugin/Inhibitor.js';
import { promisify } from 'util';
import type { ClientEvents, Interaction } from 'discord.js';
import type { Client } from '../classes/client/index.js';
import Command, {
	BuilderFunction,
	ExecuteFunction,
} from '../classes/plugin/Command.js';
import {
	existsDirectory,
	existsFile,
	mkdir,
	readFile,
	writeFile,
} from '../functions/FileSystem.js';
import { merge } from '@oadpoaw/utils';

export { default as PlaceHolder } from '../functions/PlaceHolder.js';

const execute = promisify(exec);

export interface PluginMetaData {
	/**
	 * - This attribute is the name of your plugin.
	 * - Alphanumeric characters and underscores (a-z,A-Z,0-9, _)
	 * - Used to determine the name of the plugin's data folder.
	 * - It is good practice to name your `.js` the same as this (eg: MyPlugin.js)
	 *
	 */
	name: string;
	/**
	 * - The human friendly description of the plugin.
	 * - The description can have multiple lines.
	 */
	description: string;
	/**
	 * - The version of the plugin.
	 * - Use [Semantic Versioning](https://semver.org/).
	 *
	 * which is written as `MAJOR.MINOR.PATCH (eg: 0.6.9 or 4.2.0)`
	 *
	 * Example
	 * ```js
	 * version: '1.3.5'
	 * ```
	 */
	version: string;
	/**
	 * - Author(s) of the plugin
	 * - Uniquely identifies who developed this plugin.
	 * - Used in some server error messages to provide helpful feedback on who to contact when an error occurs.
	 *
	 * Examples:
	 * ```js
	 * author: 'oadpoaw'
	 * ```
	 * ```js
	 * author: ['oadpoaw', 'ZeroSync']
	 * ```
	 * With emails:
	 * ```js
	 * author: 'oadpoaw <oadpoaw@gmail.com>'
	 * ```
	 * ```js
	 * author: ['oadpoaw <oadpoaw@gmail.com>']
	 * ```
	 */
	author: string | string[];
	/**
	 * - A list of plugins that your plugin requires to load.
	 * - And plugins that will be loaded **before** your plugin.
	 * - If any plugin listed here is not found your plugin will fail to load.
	 *
	 * This should be a valid plugin name and it's CaSe-SeNsItIvE
	 *
	 * Example:
	 * ```js
	 * dependencies: ['Economy', 'Tickets']
	 * ```
	 */
	dependencies?: string[];
	/**
	 * - A list of plugins that are optional for your plugin to have full functionality.
	 * - And plugins that will be loaded **before** your plugin.
	 */
	optionalDependencies?: string[];
	/**
	 * - A list of plugins that are incompatible with your plugin.
	 * - If any plugin listed here is found your plugin will fail to load.
	 */
	incompatibleDependencies?: string[];
	/**
	 * - A list of plugins that should be loaded **before** your plugin.
	 * - Treated as if the listed plugins are optional dependencies.
	 * - Circular optional dependencies are loaded arbitrarily.
	 */
	loadBefore?: string[];
	/**
	 * - A list of packages that your plugin needs which can be loaded from NPM.
	 *
	 * Example:
	 * ```js
	 * dependencies: ['is-plain-object', 'lodash']
	 * ```
	 *
	 * Note: The dependencies listed won't be save to package.json
	 */
	npmDependencies?: string[];
}

export default interface Plugin {
	/**
	 * - Called when this plugin is loaded.
	 */
	onLoad(): void | Promise<void>;

	/**
	 * - Called when this plugin is reloaded.
	 */
	onReload(): void | Promise<void>;

	/**
	 * - Called when some of this plugin's command is done executing.
	 */
	onCommand(interaction: Interaction, command: Command): void | Promise<void>;

	/**
	 * - Called when some of this plugin's commands throws an error.
	 */
	onCommandError(
		interaction: Interaction,
		command: Command,
		error: any,
	): void | Promise<void>;
}

export default abstract class Plugin implements Partial<Plugin> {
	private _cfg: any | null;
	private _commands: Command[];
	private _events: DiscordEvent<any>[];
	private _inhibitors: Inhibitor[];
	private _initialized: boolean;

	/**
	 * - The Discord.js Client who instantiated this plugin.
	 */
	protected readonly client: Client;
	/**
	 * - The file name which where the plugin was loaded.
	 */
	public readonly fileName: string;

	public constructor(client: Client, fileName: string) {
		this.client = client;
		this.fileName = fileName;
		this._cfg = null;
		this._commands = [];
		this._events = [];
		this._inhibitors = [];
		this._initialized = false;
	}

	/**
	 * Get the plugin's metadata
	 */
	abstract readonly metadata: PluginMetaData;

	/**
	 * - Initialize the plugin.
	 * - Called internally by the plugin loader.
	 */
	public async init() {
		if (this._initialized)
			throw new DisclosureError(
				`Plugin '${this.metadata.name}' is already initialized.`,
			);

		const pluginFolder = ['plugins', this.metadata.name];

		if (!existsDirectory(pluginFolder)) mkdir(pluginFolder);

		this.getConfig();

		await this.install();

		if (typeof this.onLoad === 'function') {
			await this.onLoad();
		}

		this._initialized = true;
	}

	/**
	 * Get the plugin's default configuration for plugin's config.yml
	 * - Can be overrided.
	 */
	public getDefaultConfig(): Record<any, any> {
		return {};
	}

	/**
	 * - Set the config for plugin's config.yml
	 */
	public setConfig(cfg: Record<any, any>): Record<any, any> {
		const merged = merge(this.getDefaultConfig(), cfg);

		writeFile(
			['plugins', this.metadata.name, 'config.yml'],
			yaml.stringify(merged),
		);

		return (this._cfg = merged);
	}

	/**
	 * - Get the config for plugin's config.yml
	 * @param force Forcefully get the config from plugin's config.yml and ignoring cache.
	 */
	public getConfig(force = false): Record<any, any> {
		if (this._cfg && !force) {
			return this._cfg;
		}

		const filePath = ['plugins', this.metadata.name, 'config.yml'];

		if (!existsFile(filePath)) {
			return this.setConfig(this.getDefaultConfig());
		} else {
			const buffer = readFile(filePath);
			return (this._cfg = merge(
				this.getDefaultConfig(),
				yaml.parse(buffer.toString()),
			));
		}
	}

	/**
	 * - Install the plugin's NPM dependencies
	 * - This does not saves the NPM dependencies to package.json
	 */
	public async install() {
		if (
			this.metadata.npmDependencies &&
			this.metadata.npmDependencies.length
		) {
			const { stderr } = await execute(
				`npm install --no-save ${this.metadata.npmDependencies.join(
					' ',
				)}`,
			);

			if (stderr) {
				throw new Error(stderr);
			}
		}
	}

	/**
	 * - Reload plugin's configuration from it's config.yml
	 * - Reinstalls the npmDependencies of the plugin.
	 */
	public async reload() {
		this.getConfig(true);
		await this.install();

		if (typeof this.onReload === 'function') {
			await this.onReload();
		}
	}

	/**
	 * - Create and Add a command that is with the plugin.
	 */
	protected addCommand(builder: BuilderFunction, exec: ExecuteFunction) {
		const command = new Command(this, builder, exec);

		if (this._commands.some((x) => x.name === command.name)) {
			throw `- ${this.metadata.name}\n\t- Command '${command.name}' is already added to the plugin. Is this a duplicate?`;
		}

		this._commands.push(command);
	}

	/**
	 * - Add an event listener that is with the plugin
	 */
	protected addEvent<K extends keyof ClientEvents>(
		event: K,
		fn: Listener<K>,
	) {
		this._events.push(new DiscordEvent(event, fn));
	}

	/**
	 * - Create and Add an inhibitor function that runs first before executing a slash command.
	 * - Return `true` to continue executing the command.
	 * - Return `false` to discontinue executing the command.
	 */
	protected addInhibitor(inhibitor: InhibitorFunction) {
		const wrapped: InhibitorFunction = (interaction, command) => {
			try {
				return inhibitor(interaction, command);
			} catch (err) {
				this.client.logger
					.error(
						`[plugin:${this.metadata.name}] Error occured - Breaking the inhibitor chain...`,
					)
					.error(err);

				return true;
			}
		};
		this._inhibitors.push(new Inhibitor(this.client, this, wrapped));
	}

	/**
	 * - An array of commands with the plugin
	 */
	public get commands() {
		return this._commands;
	}

	/**
	 * - An array of events with the plugin
	 */
	public get events() {
		return this._events;
	}

	/**
	 * - An array of inhibitor with the plugin
	 */
	public get inhibitors() {
		return this._inhibitors;
	}
}
