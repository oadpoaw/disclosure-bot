import type Plugin from '@disclosure/Plugin';
import type { PluginMetaData } from '@disclosure/Plugin';
import type { Client } from 'discord.js';
import packageNameRegex from 'package-name-regex';

export async function VerifyMetaData(metadata: PluginMetaData) {
	const errors: string[] = [];

	const semverRegex = (await import('semver-regex')).default();

	const { name, description, version } = metadata;

	VerifyName(
		name,
		errors,
		`Plugin.name should be specified and it's alphanumeric characters and underscores.`,
	);

	if (typeof description !== 'string' || description.length === 0) {
		errors.push(`Plugin.description should be specified and not empty`);
	}

	if (typeof version !== 'string' || !semverRegex.test(version)) {
		errors.push(
			`Plugin.version should be specified and it should match the Semver format https://semver.org/`,
		);
	}

	if (Array.isArray(metadata.author) && typeof metadata.author !== 'string') {
		if (metadata.author.length === 0)
			errors.push(
				'Plugin.author should be a valid string or an array of none empty strings.',
			);
		else
			metadata.author.forEach((author, i) => {
				if (typeof author !== 'string' || author.length === 0)
					errors.push(
						`Plugin.author[${i}] should not be empty and must be specified.`,
					);
			});
	} else if (
		typeof metadata.author === 'string' &&
		metadata.author.length === 0
	) {
		errors.push(
			`Plugin.author should be a valid none empty string or an array of none empty strings.`,
		);
	}

	if (Boolean(metadata.dependencies)) {
		if (!Array.isArray(metadata.dependencies)) {
			errors.push(
				`Plugin.dependencies should be an array of plugin names (array of strings).`,
			);
		} else {
			metadata.dependencies.forEach((plugin, i) => {
				VerifyName(
					plugin,
					errors,
					`Plugin.dependencies[${i}] should be specified and it's alphanumeric characters and underscores/`,
				);
				if (plugin === metadata.name)
					errors.push(
						`Plugin.dependencies[${i}] should not match the plugin name.`,
					);
			});
		}
	}

	if (Boolean(metadata.optionalDependencies)) {
		if (!Array.isArray(metadata.optionalDependencies)) {
			errors.push(
				`Plugin.optionalDependencies should be an array of plugin names (array of strings).`,
			);
		} else {
			metadata.optionalDependencies.forEach((plugin, i) => {
				VerifyName(
					plugin,
					errors,
					`Plugin.optionalDependencies[${i}] should be specified and it's alphanumeric characters and underscores.`,
				);
				if (plugin === metadata.name)
					errors.push(
						`Plugin.optionalDependencies[${i}] should not match the plugin name.`,
					);
			});
		}
	}

	if (Boolean(metadata.loadBefore)) {
		if (!Array.isArray(metadata.loadBefore)) {
			errors.push(
				`Plugin.loadBefore should be an array of plugin names (array of strings).`,
			);
		} else {
			metadata.loadBefore.forEach((plugin, i) => {
				VerifyName(
					plugin,
					errors,
					`Plugin.loadBefore[${i}] should be specified and it's alphanumeric characters and underscores.`,
				);

				if (plugin === metadata.name)
					errors.push(
						`Plugin.loadBefore[${i}] should not match the plugin name.`,
					);
			});
		}
	}

	if (Boolean(metadata.npmDependencies)) {
		if (!Array.isArray(metadata.npmDependencies)) {
			errors.push(
				`Plugin.npmDependencies should be an array of NPM package names (array of strings).`,
			);
		} else {
			metadata.npmDependencies.forEach((pkg, i) => {
				if (typeof pkg !== 'string' || packageNameRegex.test(pkg))
					errors.push(
						`Plugin.npmDependencies[${i}] should be specified and it's alphanumeric characters and underscores.`,
					);
			});
		}
	}

	if (errors.length) {
		throw `- ${metadata.name}\n\t- ${errors.join('\n\t- ')}`;
	}
}

function VerifyName(name: string, errors: string[], error: string) {
	if (typeof name !== 'string' || !/^\w+$/.test(name)) {
		errors.push(error);
	}
}

export function VerifyDependencies(plugin: Plugin, client: Client<boolean>) {
	if (plugin.metadata.dependencies && plugin.metadata.dependencies.length) {
		const errors: string[] = [];
		for (const name of plugin.metadata.dependencies) {
			const p = client.plugins.get(name);

			if (!p) {
				errors.push(
					`'${plugin.metadata.name}' plugin requires '${name}' plugin and it's not installed.`,
				);
			}
		}

		if (errors.length) {
			throw `- ${plugin.metadata.name}\n\t- ${errors.join('\n\t- ')}`;
		}
	}
}
