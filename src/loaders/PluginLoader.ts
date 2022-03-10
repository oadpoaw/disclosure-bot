import path from 'path';
import { Plugin } from '@structures/Plugin';
import type { Client } from 'discord.js';
import { readdir } from '../utils/FileSystem';

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
				.error(`[plugins] error importing '${pluginPath}'`)
				.error(err);
		}
	}

	if (!client.config.bot.sharding)
		client.logger.info(
			`[plugins] Loading ${client.plugins.size} plugin${
				client.plugins.size > 1 ? 's' : ''
			}.`,
		);

	for (const plugin of client.plugins
		.toJSON()
		.sort(
			(a, b) => (b.metadata.priority || 1) - (a.metadata.priority || 1),
		)) {
		try {
			if (plugin.metadata.dependencies.length) {
				const errors: string[] = [];
				for (const pl of plugin.metadata.dependencies) {
					const [name, version] = pl.split(/@/g) as [
						string,
						string | undefined,
					];

					const p = client.plugins.get(name);

					if (p && version && version !== p.metadata.version) {
						errors.push(
							`'${plugin.metadata.name}' plugin requires version '${version}' of '${name}' but gotten '${p.metadata.version}'`,
						);
					} else {
						errors.push(
							`'${plugin.metadata.name}' plugin requires '${name}' plugin and it's not installed`,
						);
					}
				}

				if (errors.length)
					throw `- ${plugin.metadata.name}\n\t- ${errors.join(
						'\n\t- ',
					)}`;
			}

			await plugin.init();
		} catch (err) {
			client.logger.error(
				`[plugins] error loading '${plugin.metadata.name}' plugin\n${err}`,
			);

			client.plugins.delete(plugin.metadata.name);
		}
	}

	for (const plugin of client.plugins
		.toJSON()
		.sort(
			(a, b) => (b.metadata.priority || 1) - (a.metadata.priority || 1),
		)) {
		for (const instance of plugin.events) {
			client.on(instance.eventName, async (...args: any) => {
				try {
					await instance.on(client, ...args);
				} catch (error: any) {
					client.logger.error(
						`[events:plugin:${plugin.metadata.name}] ${instance.eventName}\n${error.stack}`,
					);
				}
			});
		}
	}

	const ascend = client.plugins
		.toJSON()
		.sort(
			(a, b) => (a.metadata.priority || 1) - (b.metadata.priority || 1),
		);

	for (const plugin of ascend) {
		for (const instance of plugin.commands) {
			if (
				!client.config.bot.sharding &&
				client.commands.has(instance.name)
			) {
				for (const owner of ascend) {
					const ex = owner.commands.find(
						(cmd) => cmd.name === instance.name,
					);

					if (ex) {
						client.logger.warn(
							`Command '${ex.name}' from '${owner.metadata.name}' plugin will be override by '${plugin.metadata.name}' plugin`,
						);
						break;
					}
				}
			}

			client.commands.set(instance.name, instance);
		}
	}

	if (!client.config.bot.sharding)
		client.logger.info(
			`[plugins] ${client.plugins.size} plugin${
				client.plugins.size > 1 ? 's' : ''
			} loaded.`,
		);
}
