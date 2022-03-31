import { exec } from 'child_process';
import { existsDirectory, mkdir } from '../utils/FileSystem.js';
import { promisify } from 'util';
import type { Plugin } from '#disclosure/Plugin';
import type { Client } from 'discord.js';
import type { Graph } from '../classes/Graph';
import packageNameRegex from 'package-name-regex';
import semverRegex from 'semver-regex';
import z from 'zod';

const execute = promisify(exec);

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

export async function PluginInitializer(
	DependencyGraph: Graph,
	client: Client<boolean>,
) {
	const plugins = DependencyGraph.topologicalSort()
		.map((name) => client.plugins.get(name))
		.filter((plugin) => plugin) as Plugin[];

	for (const plugin of plugins) {
		try {
			client.logger.info(`- ${plugin.metadata.name}`);
			PluginMetaDataValidator.refine(
				({ name }) => plugin.pluginPath.endsWith(`${name}.js`),
				{
					message:
						"Plugin name should match as the plugin's file name",
				},
			).parse(plugin.metadata);

			const errors: string[] = [];

			if (
				plugin.metadata.dependencies &&
				plugin.metadata.dependencies.length
			) {
				for (const name of plugin.metadata.dependencies) {
					const p = client.plugins.get(name);

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
				for (const name of plugin.metadata.incompatibleDependencies) {
					const p = client.plugins.get(name);

					if (p) {
						errors.push(
							`'${plugin.metadata.name}' plugin is incompatible with '${name}' plugin and it's installed. `,
						);
					}
				}
			}

			if (errors.length) {
				throw `- ${plugin.metadata.name}\n\t- ${errors.join('\n\t- ')}`;
			}

			const pluginFolder = ['plugins', plugin.metadata.name];

			if (!existsDirectory(pluginFolder)) {
				mkdir(pluginFolder);
				plugin.onInitialize(client);
			}

			//@ts-ignore
			plugin._initialized = true;

			for (const key in plugin.defaultConfigs) {
				plugin.getConfig(key, true);
			}

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

			plugin.onLoad(client);
		} catch (err) {
			client.logger
				.error(
					`[plugin] could not load '${plugin.metadata.name}' plugin`,
				)
				.error(err);

			client.plugins.delete(plugin.metadata.name);
			DependencyGraph.removeNode(plugin.metadata.name);
		}
	}
}
