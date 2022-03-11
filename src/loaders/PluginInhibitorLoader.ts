import type Plugin from '@disclosure/Plugin';
import type { Client } from 'discord.js';
import type { Graph } from '../classes/Graph';

export function PluginInhibitorLoader(
	DependencyGraph: Graph,
	client: Client<boolean>,
) {
	for (const plugin of DependencyGraph.topologicalSort()
		.map((name) => client.plugins.get(name))
		.reverse() as Plugin[]) {
		for (const inhibitor of plugin.inhibitors) {
			client.dispatcher.inhibitors.push(inhibitor);
		}
	}
}