import Plugin from '#disclosure/Plugin';
import type { Client } from 'discord.js';
import { readdir } from '../../functions/FileSystem.js';
import { CreateDependencyGraph } from '../../functions/CreateDependencyGraph.js';
import { PluginEventLoader as PluginEventLoader } from './PluginEventLoader.js';
import { PluginCommandLoader } from './PluginCommandLoader.js';
import { PluginInhibitorLoader } from './PluginInhibitorLoader.js';
import { PluginInitializer } from '../../functions/plugin/PluginInitializer.js';

export default async function PluginLoader(client: Client) {
	const files = readdir(['plugins']).filter((e) => e.endsWith('.js'));

	for (const file of files) {
		const pluginPath = `../../../plugins/${file}`;

		try {
			const p = (await import(pluginPath)).default as typeof Plugin;

			if (p.prototype instanceof Plugin) {
				//@ts-ignore
				const instance = new p(client, file);

				client.plugins.set(instance.metadata.name, instance);
			}
		} catch (err) {
			client.logger
				.error(`[plugin] error importing '${pluginPath}'`)
				.error(err);
		}
	}

	if (!client.config.bot.sharding)
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

	if (!client.config.bot.sharding)
		client.logger.info(
			`[plugin] ${client.plugins.size} plugin${
				client.plugins.size > 1 ? 's' : ''
			} loaded.`,
		);

	//@ts-ignore
	client.dependencyGraph = DependencyGraph;
}
