import packageNameRegex from 'package-name-regex';
import semverRegex from 'semver-regex';
import { Collection, Client } from 'discord.js';
import { exec } from 'child_process';
import { existsDirectory, mkdir, readdir } from '@oadpoaw/utils/fs/sync';
import { Graph } from './Graph.js';
import { Plugin } from './Plugin.js';
import { promisify } from 'util';
import { z } from 'zod';

export class PluginManager {
	private plugins: Collection<string, Plugin> = new Collection();
	private graph: Graph = new Graph();
	private init: boolean = false;

	public constructor(private client: Client) {}

	public async initialize() {
		if (this.init) {
			throw new Error(`PluginManager has already been initialized.`);
		}

		this.init = true;

		this.client.logger.info(`[PluginManager] Initializing...`);

		const files = readdir(['plugins']).filter((e) => e.endsWith('.js'));

		for (const file of files) {
			const pluginPath = `../../plugins/${file}`;

			try {
				const constr = (await import(pluginPath))
					.default as typeof ExtendedPlugin;

				if (constr.prototype instanceof Plugin) {
					const plugin = new constr(this.client);

					plugin.pluginPath = pluginPath;

					PluginMetaDataValidator.refine(
						({ name }) => plugin.pluginPath.endsWith(`${name}.js`),
						{
							message:
								"Plugin name should match as the plugin's file name",
						},
					).parse(plugin.metadata);

					if (plugin.metadata.npmDependencies) {
						for (const dep of plugin.metadata.npmDependencies) {
							try {
								await import(dep);
							} catch (err) {
								const { stderr } = await execute(
									`npm --prefix plugins install ${dep}`,
								);

								if (stderr) {
									throw new Error(stderr);
								}
							}
						}
					}

					this.plugins.set(plugin.metadata.name, plugin);
				}
			} catch (err) {
				this.client.logger
					.error(
						`[PluginManager] error importing '${
							file.split('/')[3]
						}' plugin.`,
					)
					.error(err);
			}
		}

		this.client.logger.info(
			`[PluginManager] Loading ${this.client.plugins.size} plugin${
				this.client.plugins.size > 1 ? 's' : ''
			}.`,
		);

		// # Create Plugin Dependency Graph
		for (const [, plugin] of this.plugins) {
			this.graph.addNode(plugin.metadata.name);

			if (plugin.metadata.dependencies) {
				for (const dependency of plugin.metadata.dependencies) {
					this.graph.addEdge(plugin.metadata.name, dependency);
				}
			}

			if (plugin.metadata.optionalDependencies) {
				for (const dependency of plugin.metadata.optionalDependencies) {
					if (this.has(dependency)) {
						this.graph.addEdge(plugin.metadata.name, dependency);
					}
				}
			}

			if (plugin.metadata.loadBefore) {
				for (const dependency of plugin.metadata.loadBefore) {
					if (!this.graph.hasEdge(dependency, plugin.metadata.name)) {
						if (this.has(dependency)) {
							this.graph.addEdge(
								dependency,
								plugin.metadata.name,
							);
						}
					}
				}
			}
		}

		// # Preload plugins
		for (const plugin of this.getPlugins()) {
			this.client.logger.info(`- ${plugin.metadata.name}`);

			try {
				const errors: string[] = [];

				if (
					plugin.metadata.dependencies &&
					plugin.metadata.dependencies.length
				) {
					for (const name of plugin.metadata.dependencies) {
						const p = this.has(name);

						if (!p) {
							errors.push(
								`'${plugin.metadata.name}' plugin depends on '${name}' plugin and it's not installed or the plugin failed to load.`,
							);
						}
					}
				}

				if (
					plugin.metadata.incompatibleDependencies &&
					plugin.metadata.incompatibleDependencies.length
				) {
					for (const name of plugin.metadata
						.incompatibleDependencies) {
						const p = this.has(name);

						if (p) {
							errors.push(
								`'${plugin.metadata.name}' plugin is incompatible with '${name}' plugin and it's installed. `,
							);
						}
					}
				}

				if (errors.length) {
					throw `- ${plugin.metadata.name}\n\t- ${errors.join(
						'\n\t- ',
					)}`;
				}

				const pluginFolder = ['plugins', plugin.metadata.name];

				if (!existsDirectory(pluginFolder)) {
					mkdir(pluginFolder);
					if (typeof plugin.onInitialize === 'function') {
						await plugin.onInitialize();
					}
				}

				//@ts-ignore
				for (const key in plugin.defaultConfigs) {
					//@ts-ignore
					plugin.getConfig(key, true);
				}
			} catch (err) {
				this.client.logger
					.error(
						`[PluginManager] Error preloading ${plugin.metadata.name} plugin.`,
					)
					.error(err);

				this.plugins.delete(plugin.metadata.name);
				this.graph.removeNode(plugin.metadata.name);
			}
		}

		// # Trigger plugins' onLoad event lisener.
		for (const plugin of this.getPlugins()) {
			if (typeof plugin.onLoad === 'function') {
				try {
					await plugin.onLoad();
				} catch (err) {
					this.client.logger
						.error(
							`[PluginManager] Error loading ${plugin.metadata.name} plugin.`,
						)
						.error(err);

					if (typeof plugin.onError === 'function') {
						await plugin.onError(err);
					}
				}
			}
		}

		let eventCount = 0;

		// # Register plugins' commands, events, and inhibitors.
		for (const plugin of this.getPlugins()) {
			for (const command of plugin.commands) {
				const ex = this.client.commands.get(command.slash.name);

				if (ex) {
					this.client.logger.warn(
						`Command '${ex.slash.name}' from '${ex.plugin.metadata.name}' plugin will be override by '${plugin.metadata.name}' plugin`,
					);
				}

				this.client.commands.set(command.slash.name, command);
			}

			for (const [eventName, listener] of plugin.events) {
				this.client.on(eventName, listener);
				eventCount++;
			}

			for (const inhibitor of plugin.inhibitors) {
				this.client.dispatcher.inhibitors.push(inhibitor);
			}
		}

		this.client.logger.info(
			`[PluginManager] ${this.client.plugins.size} plugin${
				this.client.plugins.size > 1 ? 's' : ''
			} loaded.`,
		);

		this.client.logger.info(
			`- ${this.client.commands.size} Command(s) loaded`,
		);
		this.client.logger.info(`- ${eventCount} Event(s) loaded`);
		this.client.logger.info(
			`- ${this.client.dispatcher.inhibitors.length} Inhibitor(s) loaded`,
		);

		this.client.logger.info(`[PluginManager] Initialized.`);
	}

	public get(pluginName: string): Plugin | undefined {
		return this.plugins.get(pluginName);
	}

	public has(pluginName: string) {
		return this.plugins.some(
			(plugin) => plugin.metadata.name === pluginName,
		);
	}

	public get size() {
		return this.plugins.size;
	}

	public getPlugins(): Plugin[] {
		return this.graph
			.topologicalSort()
			.map((x) => this.get(x))
			.filter((plugin) => plugin) as Plugin[];
	}
}

const execute = promisify(exec);

const PluginName = z
	.string()
	.min(3, `Plugin name should have a minimum length of 3 characters.`)
	.max(16, `Plugin name should not exceed a maximum length of 16 characters.`)
	.refine((arg) => /^\w+$/.test(arg), {
		message: 'Plugin name should be alphanumeric and no spaces',
	});

const PluginAuthor = z
	.string()
	.min(
		3,
		`Plugin.metadata.author name should have a minimum length of 3 characters.`,
	)
	.max(
		128,
		`Plugin.metadata.author should not exceed a maximum of 128 characters.`,
	);

const PluginDeps = PluginName.array().optional();

const PluginMetaDataValidator = z.object({
	name: PluginName,
	description: z
		.string()
		.min(
			3,
			`Plugin.metadata.description should have a minimum length of 3 characters.`,
		)
		.max(
			128,
			`Plugin.metadata.description should not exceed a maximum of 128 characters.`,
		),
	version: z.string().refine((arg) => semverRegex().test(arg), {
		message: 'Version should match semver format. https://semver.org/',
	}),
	author: PluginAuthor.or(
		PluginAuthor.array().nonempty(
			`Plugin.metadata.author array should not be empty.`,
		),
	),
	dependencies: PluginDeps,
	optionalDependencies: PluginDeps,
	incompatibleDependencies: PluginDeps,
	loadBefore: PluginDeps,
	npmDependencies: z
		.string()
		.refine((arg) => packageNameRegex.test(arg))
		.array()
		.optional(),
});

export interface PluginMetaData
	extends z.infer<typeof PluginMetaDataValidator> {
	/**
	 * - This attribute is the name of your plugin.
	 * - Alphanumeric characters and underscores (a-z,A-Z,0-9, _)
	 * - Used to determine the name of the plugin's data folder.
	 *
	 */
	name: string;
	/**
	 * - The human-friendly description of the plugin.
	 * - The description can have multiple lines.
	 * - Must not exceed 128 characters.
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
	 * - Author(s) of the plugin.
	 * - Uniquely identifies who developed this plugin.
	 * - Used in some error messages to provide helpful feedback on who to contact when an error occurs.
	 *
	 * Examples:
	 * ```js
	 * author: 'oadpoaw'
	 * ```
	 * ```js
	 * author: ['oadpoaw', 'ZeroSync', 'Dragonizedpizza']
	 * ```
	 * With emails:
	 * ```js
	 * author: 'oadpoaw <oadpoaw@gmail.com>'
	 * ```
	 * ```js
	 * author: ['oadpoaw <oadpoaw@gmail.com>']
	 * ```
	 */
	author: string | [string];
	/**
	 * - A list of plugins that your plugin requires to load.
	 * - And plugins that will be loaded **before** your plugin.
	 * - If any plugin listed here is not found your plugin will fail to load.
	 *
	 * This should be a valid plugin name and its CaSe-SeNsItIvE
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
	 * - A list of plugins that should be loaded **after** your plugin.
	 * - Treated as if the listed plugins are optional dependencies.
	 * - Circular optional dependencies are loaded arbitrarily.
	 */
	loadBefore?: string[];
	/**
	 * - A list of packages that your plugin needs that can be loaded from NPM.
	 *
	 * Example:
	 * ```js
	 * dependencies: ['is-plain-object', 'lodash']
	 * ```
	 *
	 * Note: The dependencies listed won't be saved to package.json
	 */
	npmDependencies?: string[];
}

class ExtendedPlugin extends Plugin {
	public constructor(client: Client) {
		//@ts-ignore
		super(client, {});
	}
}
