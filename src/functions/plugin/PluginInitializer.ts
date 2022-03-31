import PluginVerifier from './PluginVerifier.js';
import type { Plugin } from '#disclosure/Plugin';
import type { Client } from 'discord.js';
import type { Graph } from '../../classes/util/Graph.js';
import { existsDirectory, mkdir } from '../FileSystem.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import setTerminalTitle from '../setTerminalTitle.js';

const execute = promisify(exec);

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
			PluginVerifier(client, plugin);

			const pluginFolder = ['plugins', plugin.metadata.name];

			if (!existsDirectory(pluginFolder)) {
				mkdir(pluginFolder);
				plugin.emit('init', client);
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

					setTerminalTitle('Disclosure Bot');
				}
			}

			plugin.emit('load', client);
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

	for (const plugin of plugins) {
		plugin.emit('plugins', client, plugins);
	}
}
