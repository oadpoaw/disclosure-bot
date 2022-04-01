import Logger from '../utils/Logger.js';
import yaml from 'yaml';
import { existsFile, readFile, writeFile } from '@oadpoaw/utils/fs/sync';
import { merge } from '@oadpoaw/utils';
import { SlashCommandBuilder } from '@discordjs/builders';
import type { Client, ClientEvents } from 'discord.js';
import type {
	PluginParam,
	ExecuteFunction,
	EventListener,
	InhibitorFunction,
	Command,
} from '../types/PluginTypes';
import type z from 'zod';
import type { PluginMetaData } from './PluginMetaData';

export class Plugin<
	Config extends PluginParam['configuration'] = PluginParam['configuration'],
> {
	private _initialized: boolean = false;
	private _commands: Omit<Command, 'plugin'>[] = [];
	private _events: [keyof ClientEvents, EventListener<any>][] = [];
	private _inhibitors: InhibitorFunction[] = [];
	private _configs: Record<string, any> = {};

	/**
	 * - Plugin's metadata.
	 */
	public metadata: PluginMetaData;
	/**
	 * - Plugin's default configuration with validation.
	 */
	public defaultConfigs: Config;

	/**
	 * - Plugin's file path.
	 */
	public pluginPath!: string;

	public constructor(param: PluginParam<Config>) {
		this.metadata = param.metadata;
		this.defaultConfigs = param.configuration;
	}

	/**
	 * - Called when it's the first time this plugin is loaded.
	 */
	public onInitialize(_client: Client): void | Promise<void> {}

	/**
	 * - Called when this plugin is loaded.
	 */
	public onLoad(_client: Client): void | Promise<void> {}

	/**
	 * - Called when all plugins has been loaded.
	 */
	public onPluginsLoad(_client: Client, _plugins: Plugin[]): void | Promise<void> {}

	/**
	 * - Called when this plugin encounters an error.
	 */
	public onError(_error: any): void | Promise<void> {}

	/**
	 * - An array of commands of the plugin.
	 */
	public get commands(): Command[] {
		return this._commands.map((command) => ({ plugin: this, ...command }));
	}

	/**
	 * - An array of events with the plugin.
	 */
	public get events() {
		return this._events;
	}

	/**
	 * - An array of inhibitors with the plugin.
	 */
	public get inhibitors() {
		return this._inhibitors;
	}

	/**
	 * - Add a Slash command with this plugin.
	 */
	public addCommand(options: Command['options'], exec: ExecuteFunction) {
		if (!this._initialized) {
			throw new Error(
				`'${this.metadata.name}' plugin has not been initialized.`,
			);
		}

		if (this._commands.some((x) => x.slash.name === options.name)) {
			throw new Error(
				`Command '${options.name}' is already added to the plugin. Is this a duplicate?`,
			);
		}

		const slash = options.options
			? options.options(new SlashCommandBuilder())
			: new SlashCommandBuilder();

		this._commands.push({
			slash: slash
				.setName(options.name.toLowerCase())
				.setDescription(options.description),
			execute: async (interaction) => {
				try {
					return await exec(interaction);
				} catch (err) {
					Logger.error(
						`[plugin:${this.metadata.name}] Error occured - Command '${interaction.commandName}'`,
					).error(err);

					this.onError(err);
				}
			},
			options,
		});
	}

	/**
	 * - Add a discord event listener with this plugin.
	 */
	public addEvent<K extends keyof ClientEvents>(
		eventName: K,
		listener: EventListener<K>,
	) {
		if (!this._initialized) {
			throw new Error(
				`'${this.metadata.name}' plugin has not been initialized.`,
			);
		}

		this._events.push([
			eventName,
			async (...args) => {
				try {
					await listener(...args);
				} catch (error: any) {
					Logger.error(
						`[events:plugin:${this.metadata.name}] ${eventName} - ${this.metadata.author}`,
					).error(error);

					this.onError(error);
				}
			},
		]);
	}

	/**
	 * - Add an inhibitor function that runs first before executing a slash command.
	 * - Return `true` to continue executing the command.
	 * - Return `false` to discontinue executing the command.
	 */
	public addInhibitor(inhibitor: InhibitorFunction) {
		if (!this._initialized) {
			throw new Error(
				`'${this.metadata.name}' plugin has not been initialized.`,
			);
		}

		this._inhibitors.push((interaction, command) => {
			try {
				return inhibitor(interaction, command);
			} catch (err) {
				Logger.error(
					`[plugin:${this.metadata.name}] Inhibitor Error occured - Breaking the inhibitor chain...`,
				).error(err);
				this.onError(err);

				return true;
			}
		});
	}

	public setConfigForce<F extends keyof Config>(
		name: F,
		cfg: z.infer<Config[F]['validation']>,
	) {
		this.defaultConfigs[name].validation.parse(cfg);

		writeFile(
			['plugins', this.metadata.name, `${name}.yml`],
			yaml.stringify(cfg),
		);

		this._configs[name as string] = cfg;
	}

	/**
	 * @param name The configuration name
	 * @param force Forcefully get the config from plugin's data folder and and not from the cache.
	 */
	public getConfig<F extends keyof Config>(
		name: F,
		force = false,
	): z.infer<Config[F]['validation']> {
		if (!this._initialized) {
			throw new Error(
				`'${this.metadata.name}' plugin has not been initialized.`,
			);
		}

		if (Boolean(this._configs[name as string]) && !force) {
			return this._configs[name as string];
		}

		const filePath = ['plugins', this.metadata.name, `${name}.yml`];

		if (existsFile(filePath)) {
			const buffer = readFile(filePath);

			const data = merge(
				this.defaultConfigs[name].config,
				yaml.parse(buffer.toString()),
			);

			this.defaultConfigs[name].validation.parse(data);

			this._configs[name as string] = data;

			return data;
		}

		this.setConfigForce(name, this.defaultConfigs[name].config);
		return this._configs[name as string];
	}

	/**
	 * @param name The configuration name
	 * @param partial Partial configuration
	 */
	public setConfig<F extends keyof Config>(
		name: F,
		partial: Partial<z.infer<Config[F]['validation']>>,
	): void {
		if (!this._initialized) {
			throw new Error(
				`'${this.metadata.name}' plugin has not been initialized.`,
			);
		}

		const defaults = this.defaultConfigs[name].config;
		const current = this.getConfig(name);

		const data = merge(merge(defaults, current), partial);

		this.setConfigForce(name, data);
	}
}
