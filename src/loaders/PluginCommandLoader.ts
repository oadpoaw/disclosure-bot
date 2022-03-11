import type Plugin from '@disclosure/Plugin';
import type { Client } from 'discord.js';
import type { Graph } from '../classes/Graph';

export function PluginCommandLoader(
	DependencyGraph: Graph,
	client: Client<boolean>,
) {
	for (const plugin of DependencyGraph.topologicalSort().map((name) =>
		client.plugins.get(name),
	) as Plugin[]) {
		for (const instance of plugin.commands) {
			const ex = client.commands.get(instance.name);

			if (ex) {
				client.logger.warn(
					`Command '${ex.name}' from '${ex.plugin.metadata.name}' plugin will be override by '${plugin.metadata.name}' plugin`,
				);
			}

			client.commands.set(instance.name, instance);
		}
	}
}
