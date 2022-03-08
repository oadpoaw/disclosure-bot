import path from 'path';
import Command from '../structures/Command';
import { Client, Collection } from 'discord.js';
import { readdir } from '../utils/FileSystem';

export default async function registerCommands(
	client: Client,
): Promise<Collection<string, Command>> {
	const files = readdir('src', 'commands').filter((e) => e.endsWith('.ts'));
	const cmds = new Collection<string, Command>();

	for (const file of files) {
		try {
			const cmdPath = path.join(process.cwd(), 'src', 'commands', file);
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
