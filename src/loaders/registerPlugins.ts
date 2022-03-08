import path from 'path';
import fs from 'fs/promises';
import Plugin from '@structures/Plugin';
import type { Client } from 'discord.js';

class ExtendedPlugin extends Plugin {
	public constructor(client: any) {
		super(client, {
			name: '',
			description: '',
			version: '',
			author: '',
			dependencies: [],
		});
	}

	getDefaultConfig() {
		return {};
	}
}

export default async function registerPlugins(client: Client) {
	const filePath = path.join(process.cwd(), 'plugins');
	const files = (await fs.readdir(filePath)).filter((e) => e.endsWith('.ts'));

	client.logger.info(
		`[plugins] Loading ${files.length} plugin${
			files.length > 1 ? 's' : ''
		}.`,
	);

	for (const file of files) {
		try {
			const pluginPath = path.join(filePath, file);
			const p = (await import(pluginPath))
				.default as typeof ExtendedPlugin;

			if (p.prototype instanceof Plugin) {
				const instance = new p(client);

				await instance.init();
				client.logger.info(`- ${file}`);
			}

			delete require.cache[require.resolve(pluginPath)];
		} catch (err) {
			client.logger.error(`[plugins] error loading '${file}'`).error(err);
		}
	}

	client.logger.info(
		`[plugins] ${files.length} plugin${files.length > 1 ? 's' : ''} loaded.`,
	);
}
