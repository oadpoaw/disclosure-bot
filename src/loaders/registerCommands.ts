import path from 'path';
import fs from 'fs/promises';
import Command from '../structures/Command';
import type { Client } from 'discord.js';

export default async function registerCommands(
	client: Client,
	filePath: string,
) {
	const files = await fs.readdir(filePath);
	for (const file of files) {
		if (file.endsWith('.ts')) {
			try {
				const cmdPath = path.join(filePath, file);
				const instance = (await import(cmdPath)).cmd as Command;

				if (instance instanceof Command) {
					client.logger.info(`[commands] Loading: '${instance.name}'`);
					client.commands.set(instance.name, instance);
				}

				delete require.cache[require.resolve(cmdPath)];
			} catch (err) {
				client.logger.error(`[commands] loading '${file}'`).error(err);
				process.exit(1);
			}
		}
	}
}
