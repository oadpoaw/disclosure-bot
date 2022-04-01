import { CreateDependencyGraph } from '../functions/CreateDependencyGraph.js';
import { PluginInitializer } from '../functions/PluginInitializer.js';
import { readdir } from '@oadpoaw/utils/fs/sync';
import { Plugin } from '../structures/Plugin.js';
import type { Client } from 'discord.js';

export default async function PluginLoader(client: Client) {
	const files = readdir(['plugins']).filter((e) => e.endsWith('.js'));

	for (const file of files) {
		const pluginPath = `../../plugins/${file}`;

		try {
			const instance = (await import(pluginPath)).default as Plugin;

			if (instance instanceof Plugin) {
				instance.pluginPath = pluginPath;

				client.plugins.set(instance.metadata.name, instance);
			}
		} catch (err) {
			client.logger
				.error(`[plugin] error importing '${file}'`)
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

	const plugins = DependencyGraph.topologicalSort()
		.map((name) => client.plugins.get(name))
		.filter((plugin) => plugin) as Plugin[];

	let evs = 0;

	for (const plugin of plugins) {
		await plugin.onPluginsLoad(client, plugins);

		for (const command of plugin.commands) {
			const ex = client.commands.get(command.slash.name);

			if (ex) {
				client.logger.warn(
					`Command '${ex.slash.name}' from '${ex.plugin.metadata.name}' plugin will be override by '${plugin.metadata.name}' plugin`,
				);
			}

			client.commands.set(command.slash.name, command);
		}

		for (const [eventName, listener] of plugin.events) {
			client.on(eventName, listener);
			evs++;
		}

		for (const inhibitor of plugin.inhibitors) {
			client.dispatcher.inhibitors.push(inhibitor);
		}
	}

	client.logger.info(
		`[plugin] ${client.plugins.size} plugin${
			client.plugins.size > 1 ? 's' : ''
		} loaded.`,
	);

	client.logger.info(`${client.commands.size} Command(s) loaded.`);
	client.logger.info(`${evs} Event(s) loaded.`);
	client.logger.info(
		`${client.dispatcher.inhibitors.length} Inhibitor(s) loaded.`,
	);

	return client;
}
