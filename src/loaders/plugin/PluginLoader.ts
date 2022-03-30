import { CreateDependencyGraph } from '../../functions/CreateDependencyGraph.js';
import { PluginCommandLoader } from './PluginCommandLoader.js';
import { PluginEventLoader as PluginEventLoader } from './PluginEventLoader.js';
import { PluginInhibitorLoader } from './PluginInhibitorLoader.js';
import { PluginInitializer } from '../../functions/plugin/PluginInitializer.js';
import { readdir } from '../../functions/FileSystem.js';
import Plugin from '#disclosure/Plugin';
import type { Client } from 'discord.js';

export default async function PluginLoader(client: Client) {
	const files = readdir(['plugins']).filter((e) => e.endsWith('.js'));

	for (const file of files) {
		const pluginPath = `../../../plugins/${file}`;

		try {
			const instance = (await import(pluginPath)).default as Plugin;

			if (instance instanceof Plugin) {
				instance.pluginPath = pluginPath;

				client.plugins.set(instance.metadata.name, instance);
			}
		} catch (err) {
			client.logger
				.error(`[plugin] error importing '${pluginPath}'`)
				.error(err);
		}
	}

	client.logger.info(
		`[plugin] Loading ${client.plugins.size} plugin${
			client.plugins.size > 1 ? 's' : ''
		}.`,
	);

	const DependencyGraph = CreateDependencyGraph(client);

	await PluginInitializer(DependencyGraph, client);
	PluginCommandLoader(DependencyGraph, client);
	PluginEventLoader(client);
	PluginInhibitorLoader(DependencyGraph, client);

	client.logger.info(
		`[plugin] ${client.plugins.size} plugin${
			client.plugins.size > 1 ? 's' : ''
		} loaded.`,
	);

	//@ts-ignore
	client.dependencyGraph = DependencyGraph;
}
