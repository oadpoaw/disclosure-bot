import { Graph } from '../classes/Graph.js';
import type { Client } from 'discord.js';

export function CreateDependencyGraph(client: Client<boolean>) {
	const DependencyGraph = new Graph();

	for (const [, plugin] of client.plugins) {
		DependencyGraph.addNode(plugin.metadata.name);

		for (const dependency of plugin.metadata.dependencies || [])
			DependencyGraph.addEdge(plugin.metadata.name, dependency);

		for (const dependency of plugin.metadata.optionalDependencies || []) {
			if (client.plugins.has(dependency)) {
				DependencyGraph.addEdge(plugin.metadata.name, dependency);
			}
		}

		for (const dependency of plugin.metadata.loadBefore || []) {
			if (!DependencyGraph.hasEdge(plugin.metadata.name, dependency)) {
				if (client.plugins.has(dependency)) {
					DependencyGraph.addEdge(plugin.metadata.name, dependency);
				}
			}
		}
	}

	return DependencyGraph;
}
