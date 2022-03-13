import packageNameRegex from 'package-name-regex';
import semverRegex from 'semver-regex';
import type Plugin from '#disclosure/Plugin';
import type { Client } from 'discord.js';

export async function VerifyMetaData(plugin: Plugin) {
	const errors: string[] = [];

	const { name, description, version } = plugin.metadata;

	VerifyName(
		name,
		errors,
		`Plugin.name should be specified and it should be alphanumeric characters and underscores.`,
	);

	if (typeof name === 'string') {
		const pluginFileName = plugin.fileName.substring(
			0,
			plugin.fileName.lastIndexOf('.'),
		);

		if (pluginFileName !== name) {
			errors.push(
				`Plugin.name should be the same as the plugin's filename without the file extension.`,
			);
		}
	}

	if (typeof description !== 'string' || description.length === 0) {
		errors.push(`Plugin.description should be specified and not empty`);
	}

	if (typeof version !== 'string' || !semverRegex().test(version)) {
		errors.push(
			`Plugin.version should be specified and it should match the Semver format https://semver.org/`,
		);
	}

	if (
		Array.isArray(plugin.metadata.author) &&
		typeof plugin.metadata.author !== 'string'
	) {
		if (plugin.metadata.author.length === 0) {
			errors.push(
				'Plugin.author should be a valid string or an array of none empty strings.',
			);
		} else {
			plugin.metadata.author.forEach((author, i) => {
				if (typeof author !== 'string' || author.length === 0) {
					errors.push(
						`Plugin.author[${i}] should not be empty and must be specified.`,
					);
				}
			});
		}
	} else if (
		typeof plugin.metadata.author === 'string' &&
		plugin.metadata.author.length === 0
	) {
		errors.push(
			`Plugin.author should be a valid none empty string or an array of none empty strings.`,
		);
	}

	if (Boolean(plugin.metadata.dependencies)) {
		if (!Array.isArray(plugin.metadata.dependencies)) {
			errors.push(
				`Plugin.dependencies should be an array of plugin names (array of strings).`,
			);
		} else {
			plugin.metadata.dependencies.forEach((pl, i) => {
				VerifyName(
					pl,
					errors,
					`Plugin.dependencies[${i}] should be specified and it's alphanumeric characters and underscores/`,
				);
				if (pl === plugin.metadata.name) {
					errors.push(
						`Plugin.dependencies[${i}] should not match the plugin name.`,
					);
				}
			});
		}
	}

	if (Boolean(plugin.metadata.optionalDependencies)) {
		if (!Array.isArray(plugin.metadata.optionalDependencies)) {
			errors.push(
				`Plugin.optionalDependencies should be an array of plugin names (array of strings).`,
			);
		} else {
			plugin.metadata.optionalDependencies.forEach((pl, i) => {
				VerifyName(
					pl,
					errors,
					`Plugin.optionalDependencies[${i}] should be specified and it's alphanumeric characters and underscores.`,
				);
				if (pl === plugin.metadata.name) {
					errors.push(
						`Plugin.optionalDependencies[${i}] should not match the plugin name.`,
					);
				}
			});
		}
	}

	if (Boolean(plugin.metadata.loadBefore)) {
		if (!Array.isArray(plugin.metadata.loadBefore)) {
			errors.push(
				`Plugin.loadBefore should be an array of plugin names (array of strings).`,
			);
		} else {
			plugin.metadata.loadBefore.forEach((pl, i) => {
				VerifyName(
					pl,
					errors,
					`Plugin.loadBefore[${i}] should be specified and it's alphanumeric characters and underscores.`,
				);

				if (pl === plugin.metadata.name) {
					errors.push(
						`Plugin.loadBefore[${i}] should not match the plugin name.`,
					);
				}
			});
		}
	}

	if (Boolean(plugin.metadata.npmDependencies)) {
		if (!Array.isArray(plugin.metadata.npmDependencies)) {
			errors.push(
				`Plugin.npmDependencies should be an array of NPM package names (array of strings).`,
			);
		} else {
			plugin.metadata.npmDependencies.forEach((pkg, i) => {
				if (typeof pkg !== 'string' || !packageNameRegex.test(pkg)) {
					errors.push(
						`Plugin.npmDependencies[${i}] should be specified and it's alphanumeric characters and underscores.`,
					);
				}
			});
		}
	}

	if (errors.length) {
		throw `- ${plugin.metadata.name}\n\t- ${errors.join('\n\t- ')}`;
	}
}

function VerifyName(name: string, errors: string[], error: string) {
	if (typeof name !== 'string' || !/^\w+$/.test(name)) {
		errors.push(error);
	}
}

export function VerifyDependencies(plugin: Plugin, client: Client<boolean>) {
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
