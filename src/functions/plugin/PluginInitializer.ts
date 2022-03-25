import PluginVerifier from './PluginVerifier.js';
import type Plugin from '#disclosure/Plugin';
import type { Client } from 'discord.js';
import type { Graph } from '../../classes/util/Graph.js';

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

			await plugin.init();
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

	for (const plugin of DependencyGraph.topologicalSort()
		.map((name) => client.plugins.get(name))
		.filter((plugin) => plugin) as Plugin[]) {
		if (typeof plugin.onPluginsLoad === 'function') {
			try {
				await plugin.onPluginsLoad();
			} catch (err) {
				client.logger
					.error(
						`[plugin] error calling 'onPluginsLoad()' in '${plugin.metadata.name}' plugin`,
					)
					.error(err);
			}
		}
	}
}
