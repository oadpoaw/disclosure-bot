import type Plugin from '@disclosure/Plugin';
import type { Client } from 'discord.js';
import { VerifyMetaData, VerifyDependencies } from './PluginVerifiers';
import type { Graph } from '../classes/Graph';

export async function PluginInitializer(
	DependencyGraph: Graph,
	client: Client<boolean>,
) {
	const plugins = DependencyGraph.topologicalSort()
		.map((name) => client.plugins.get(name))
		.reverse() as Plugin[];

	for (const plugin of plugins) {
		try {
			await VerifyMetaData(plugin.metadata);
			VerifyDependencies(plugin, client);

			await plugin.init();
		} catch (err) {
			client.logger.error(
				`[plugin] could not load '${plugin.metadata.name}' plugin - ${plugin.metadata.author}\n${err}`,
			);

			client.plugins.delete(plugin.metadata.name);
			DependencyGraph.removeNode(plugin.metadata.name);
		}
	}
}
