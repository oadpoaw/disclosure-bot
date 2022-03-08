import { exec } from 'child_process';
import type { Client } from 'discord.js';
import { promisify } from 'util';
import {
	existsDirectory,
	existsFile,
	mkdir,
	readFile,
	writeFile,
} from '../utils/FileSystem';
import yaml from 'yaml';

const execute = promisify(exec);

interface PluginMetaData {
	name: string;
	description: string;
	version: string;
	author: string;
	dependencies: string[];
}

export default interface Plugin {
	/**
	 * Called when this plugin is loaded
	 */
	onLoad?: () => void | Promise<void>;

	/**
	 * Called when this plugin is reloaded
	 */
	onReload?: () => void | Promise<void>;
}

export default abstract class Plugin {
	private _cfg: Record<any, any> | null;

	public constructor(
		protected client: Client,
		public metadata: PluginMetaData,
	) {
		this._cfg = null;
	}

	/**
	 * Get the plugin's default configuration for plugins/[plugin-name]/config.yml
	 */
	abstract getDefaultConfig(): Record<any, any>;

	/**
	 * Initialize the plugin
	 */
	public async init() {
		const pluginFolder = ['plugins', this.metadata.name];

		if (!existsDirectory(...pluginFolder)) mkdir(...pluginFolder);

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

		const filePath = ['plugins', this.metadata.name, 'config.yml'];

		writeFile(str, ...filePath);
		this._cfg = cfg;

		return cfg;
	}

	/**
	 * Get the config for plugins/[plugin-name]/config.yml
	 * @param force Forcefully get config from plugins/[plugin-name]/config.yml
	 * @returns
	 */
	public getConfig(force = false): Record<any, any> {
		if (this._cfg && !force) return this._cfg;

		const filePath = ['plugins', this.metadata.name, 'config.yml'];

		if (!existsFile(...filePath)) {
			return this.setConfig(this.getDefaultConfig());
		} else {
			const buffer = readFile(...filePath);
			const b = yaml.parse(buffer.toString());
			this._cfg = b;
			return b;
		}
	}

	/**
	 * Install the plugin's dependencies
	 */
	public async install() {
		if (this.metadata.dependencies.length) {
			const { stderr } = await execute(
				`npm install --no-save ${this.metadata.dependencies.join(' ')}`,
			);

			if (stderr) throw new Error(stderr);
		}
	}

	/**
	 * Reload plugin's configuration from it's config.yml
	 * - includes reinstalling dependencies listed in the config.yml
	 */
	public async reload() {
		//
		this.getConfig(true);
		await this.install();
		//
		if (typeof this.onReload === 'function') await this.onReload();
	}
}
