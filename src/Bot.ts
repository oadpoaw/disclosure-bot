const before = Date.now();
import 'module-alias/register';
import { clientOptions } from './config';
import { Client } from './Internals';
import PluginLoader from './loaders/PluginLoader';
import ms from 'ms';
import {
	Collection,
	ApplicationCommand,
	GuildResolvable,
	ApplicationCommandDataResolvable,
} from 'discord.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { URL } from 'url';
import Keyv from 'keyv';

const execute = promisify(exec);

const client = new Client(clientOptions);

PluginLoader(client).then(async () => {
	const uri = await db();

	client.db = new Keyv(uri, { namespace: 'disclosure' });
	client.db.on('error', (err) => {
		client.logger.error(`[database] Connection Error:\n${err.stack}`);
		process.exit(1);
	});

	client.login(client.config.bot.token).then(() => {
		client.once('ready', async () => {
			if (
				(client.shard?.ids.includes(0) ||
					!client.config.bot.sharding) &&
				client.commands.size
			) {
				const commands = client.commands.map(
					(c) =>
						({
							name: c.name,
							description: c.description,
							options: c.command.options,
							type: 'CHAT_INPUT',
						} as unknown as ApplicationCommandDataResolvable),
				);

				const guildID =
					client.config.environment === 'development'
						? client.config.bot.guild
						: undefined;

				const currentCommands = await fetchCommands(guildID);

				const newCommands = commands.filter(
					(command) =>
						!currentCommands.some((c) => c.name === command.name),
				);

				for (const newCommand of newCommands)
					await client.application?.commands.create(
						newCommand,
						guildID,
					);

				const deletedCommands = currentCommands
					.filter(
						(command) =>
							!commands.some((c) => c.name === command.name),
					)
					.toJSON();

				for (const deletedCommand of deletedCommands)
					await deletedCommand.delete();

				const updatedCommands = commands.filter((command) =>
					currentCommands.some((c) => c.name === command.name),
				);

				for (const updatedCommand of updatedCommands) {
					if (updatedCommand.type === 'CHAT_INPUT') {
						const previousCommand = currentCommands.find(
							(c) => c.name === updatedCommand.name,
						);

						if (!previousCommand) continue;

						let modified = false;

						if (
							previousCommand.description !==
							updatedCommand.description
						)
							modified = true;

						if (
							!ApplicationCommand.optionsEqual(
								previousCommand.options ?? [],
								updatedCommand.options ?? [],
							)
						)
							modified = true;

						if (modified) {
							await previousCommand.edit(updatedCommand);
						}
					}
				}
			}

			if (!client.shard)
				client.logger.info(`Done! ${ms(Date.now() - before)}`);
		});
	});
});

async function db() {
	const url = new URL(client.config.database);

	let pkg = '';

	let uri = client.config.database;

	switch (url.protocol) {
		case 'redis:':
		case 'rediss:':
			pkg = '@keyv/redis';
			break;
		case 'mongodb:':
		case 'mongodb+srv:':
			pkg = '@keyv/mongodb';
			break;
		case 'postgresql:':
			pkg = '@keyv/postgres';
			break;
		case 'mysql:':
			pkg = '@keyv/mysql';
			break;
		case 'etcd:':
			pkg = '@keyv/etcd';
			break;
		case 'sqlite:':
		default: {
			const str = client.config.database;
			uri =
				str.startsWith('sqlite://') &&
				(str.endsWith('.sqlite') ||
					str.endsWith('.sqlite3') ||
					str.endsWith('.db'))
					? str
					: 'sqlite://data/data.db';
			pkg = '@keyv/sqlite';
		}
	}

	const { stderr } = await execute(`npm install --no-save ${pkg}`);

	if (stderr) throw new Error(stderr);
	return uri;
}

async function fetchCommands(guildId: string | undefined) {
	return (await client.application?.commands.fetch({
		guildId,
	})) as Collection<
		string,
		ApplicationCommand<{
			guild?: GuildResolvable;
		}>
	>;
}
