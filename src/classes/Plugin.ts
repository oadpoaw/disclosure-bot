import yaml from 'yaml';
import { existsFile, readFile, writeFile } from '@oadpoaw/utils/fs/sync';
import { merge } from '@oadpoaw/utils';
import { SlashCommandBuilder } from '@discordjs/builders';
import type { Client, ClientEvents } from 'discord.js';
import type {
	PluginParameters,
	ExecuteFunction,
	EventListener,
	InhibitorFunction,
	Command,
	BuilderFunction,
} from '../types';
import type z from 'zod';
import type { PluginMetaData } from './PluginManager.js';

export interface Plugin {
	/**
	 * - Called when it's the first time this plugin is loaded.
	 */
	onInitialize?(): void | Promise<void>;

	/**
	 * - Called when this plugin is loaded.
	 */
	onLoad?(): void | Promise<void>;

	/**
	 * - Called when this plugin encounters an error.
	 */
	onError?(_error: any): void | Promise<void>;
}

export abstract class Plugin<
	Config extends PluginParameters['configuration'] = PluginParameters['configuration'],
> {
	private _commands: Omit<Command, 'plugin'>[] = [];
	private _events: [keyof ClientEvents, EventListener<any>][] = [];
	private _inhibitors: InhibitorFunction[] = [];
	private _configs: Record<string, any> = {};

	/**
	 * - Plugin's metadata.
	 */
	public readonly metadata: PluginMetaData;
	/**
	 * - Plugin's default configuration with validation.
	 */
	protected readonly defaultConfigs: Config;

	/**
	 * - Plugin's file path.
	 */
	public pluginPath!: string;

	protected constructor(
		protected client: Client,
		param: PluginParameters<Config>,
	) {
		this.metadata = param.metadata;
		this.defaultConfigs = param.configuration || {};
	}

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
	protected addCommand(
		builder: BuilderFunction,
		exec: ExecuteFunction,
		options: Command['options'] = {},
	) {
		const slash = builder(new SlashCommandBuilder());

		this._commands.push({
			slash,
			execute: async (interaction) => {
				try {
					return await exec(interaction);
				} catch (err) {
					this.client.logger
						.error(
							`[${this.metadata.name}] Command - ${interaction.commandName}`,
						)
						.error(err);

					if (typeof this.onError === 'function') {
						this.onError(err);
					}
				}
			},
			options,
		});
	}

	/**
	 * - Add a discord event listener with this plugin.
	 */
	protected addEvent<K extends keyof ClientEvents>(
		eventName: K,
		listener: EventListener<K>,
	) {
		this._events.push([
			eventName,
			async (...args) => {
				try {
					await listener(...args);
				} catch (err: any) {
					this.client.logger
						.error(`[${this.metadata.name}] Event - ${eventName}`)
						.error(err);

					if (typeof this.onError === 'function') {
						this.onError(err);
					}
				}
			},
		]);
	}

	/**
	 * - Add an inhibitor function that runs first before executing a slash command.
	 * - Return `true` to continue executing the command.
	 * - Return `false` to discontinue executing the command.
	 */
	protected addInhibitor(inhibitor: InhibitorFunction) {
		this._inhibitors.push((interaction, command) => {
			try {
				return inhibitor(interaction, command);
			} catch (err) {
				this.client.logger
					.error(
						`[${this.metadata.name}] Inhibitor - ${inhibitor.name}`,
					)
					.error(err);

				if (typeof this.onError === 'function') {
					this.onError(err);
				}

				return false;
			}
		});
	}

	protected setConfigForce<F extends keyof Config>(
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
	protected getConfig<F extends keyof Config>(
		name: F,
		force = false,
	): z.infer<Config[F]['validation']> {
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
	protected setConfig<F extends keyof Config>(
		name: F,
		partial: Partial<z.infer<Config[F]['validation']>>,
	): void {
		const defaults = this.defaultConfigs[name].config;
		const current = this.getConfig(name);

		const data = merge(merge(defaults, current), partial);

		this.setConfigForce(name, data);
	}
}
