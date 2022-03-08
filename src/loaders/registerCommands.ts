import path from 'path';
import fs from 'fs/promises';
import Command from '../structures/Command';
import { Client, Collection } from 'discord.js';

export default async function registerCommands(
	client: Client,
	filePath: string,
): Promise<Collection<string, Command>> {
	const files = (await fs.readdir(filePath)).filter((e) => e.endsWith('.ts'));
	const cmds = new Collection<string, Command>();

	for (const file of files) {
		try {
			const cmdPath = path.join(filePath, file);
			const instance = (await import(cmdPath)).command as Command;

			if (instance instanceof Command) cmds.set(instance.name, instance);

			delete require.cache[require.resolve(cmdPath)];
		} catch (err) {
			client.logger
				.error(`[commands] error loading '${file}'`)
				.error(err);
			process.exit(1);
		}
	}

	return cmds;
}
