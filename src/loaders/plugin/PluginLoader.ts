import path from 'path';
import Plugin from '@disclosure/Plugin';
import type { Client } from 'discord.js';
import { readdir } from '../../functions/FileSystem';
import { CreateDependencyGraph } from '../../functions/CreateDependencyGraph';
import { PluginEventLoader as PluginEventLoader } from './PluginEventLoader';
import { PluginCommandLoader } from './PluginCommandLoader';
import { PluginInhibitorLoader } from './PluginInhibitorLoader';
import { PluginInitializer } from '../../functions/plugin/PluginInitializer';

export default async function PluginLoader(client: Client) {
	const files = readdir(['plugins']).filter((e) => e.endsWith('.js'));

	for (const file of files) {
		const pluginPath = path.join(process.cwd(), 'plugins', file);

		try {
			const p = (await import(pluginPath)).default as typeof Plugin;

			if (p.prototype instanceof Plugin) {
				// @ts-ignore
				const instance = new p(client);

				client.plugins.set(instance.metadata.name, instance);
			}

			delete require.cache[require.resolve(pluginPath)];
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
