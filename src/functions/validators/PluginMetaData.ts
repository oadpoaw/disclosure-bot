import packageNameRegex from 'package-name-regex';
import semverRegex from 'semver-regex';
import { z } from 'zod';

const PluginName = z
	.string()
	.min(3)
	.max(16)
	.refine((arg) => /^\w+$/.test(arg), {
		message: 'Plugin Name should be alphanumeric and no spaces',
	});

const PluginAuthor = z.string().min(3);
const PluginDeps = PluginName.array().optional();

export const PluginMetaDataValidator = z.object({
	name: PluginName,
	description: z.string().min(3).max(128),
	version: z.string().refine((arg) => semverRegex().test(arg), {
		message: 'Version should match semver format. https://semver.org/',
	}),
	author: PluginAuthor.or(PluginAuthor.array().nonempty()),
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
	 * - It is good practice to name your `.js` the same as this (eg: MyPlugin.js)
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
	 * - A list of plugins that should be loaded **before** your plugin.
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
