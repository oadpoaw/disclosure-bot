import type Plugin from '#disclosure/Plugin';
import type { Client } from 'discord.js';
import { PluginMetaDataValidator } from '../validators/PluginMetaData';

export default function PluginVerifier(
	client: Client<boolean>,
	plugin: Plugin,
) {
	const pluginFileName = plugin.pluginPath.substring(
		0,
		plugin.pluginPath.lastIndexOf('.'),
	);

	PluginMetaDataValidator.refine(({ name }) => name === pluginFileName, {
		message: "Plugin name should match as the plugin's file name",
	}).parse(plugin.metadata);

	const errors: string[] = [];

	if (plugin.metadata.dependencies && plugin.metadata.dependencies.length) {
		for (const name of plugin.metadata.dependencies) {
			const p = client.plugins.get(name);

			if (!p) {
				errors.push(
					`'${plugin.metadata.name}' plugin depends on '${name}' plugin and it's not installed or the plugin failed to load.`,
				);
			}
		}
	}

	if (
		plugin.metadata.incompatibleDependencies &&
		plugin.metadata.incompatibleDependencies.length
	) {
		for (const name of plugin.metadata.incompatibleDependencies) {
			const p = client.plugins.get(name);

			if (p) {
				errors.push(
					`'${plugin.metadata.name}' plugin is incompatible with '${name}' plugin and it's installed. `,
				);
			}
		}
	}

	if (errors.length) {
		throw `- ${plugin.metadata.name}\n\t- ${errors.join('\n\t- ')}`;
	}
}
