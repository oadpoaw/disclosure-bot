import DisclosureError from '../DisclosureError.js';
import type Command from '../plugin/Command.js';
import {
	ApplicationCommand,
	ApplicationCommandDataResolvable,
	CacheType,
	Client,
	Collection,
	CommandInteraction,
	GuildResolvable,
} from 'discord.js';
import type { Inhibitor } from '../plugin/Inhibitor.js';

export default class Dispatcher {
	public readonly awaiting: Set<string>;
	public readonly inhibitors: Inhibitor[];

	private loaded: boolean;

	public constructor(private client: Client) {
		this.awaiting = new Set();
		this.inhibitors = [];
		this.loaded = false;
	}

	private async inihibit(
		interaction: CommandInteraction<CacheType>,
		command: Command,
	) {
		for (const inhibitor of this.inhibitors) {
			let status = inhibitor.inhibitor(interaction, command);

			if (status.constructor.name === 'Promise') {
				status = await status;
			}

			if (!status) {
				return true;
			}
		}
		return false;
	}

	private async sync() {
		const client = this.client;

		if (
			(client.shard?.ids.includes(0) || !client.config.bot.sharding) &&
			client.commands.size
		) {
			this.client.logger.info(`[dispatcher] Syncing slash commands...`);

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
				client.config.environment === 'development' ||
				client.config.bot.singleGuild
					? client.config.bot.guild
					: undefined;

			const currentCommands = (await client.application?.commands.fetch({
				guildId: guildID,
			})) as Collection<
				string,
				ApplicationCommand<{
					guild?: GuildResolvable;
				}>
			>;

			const newCommands = commands.filter(
				(command) =>
					!currentCommands.some((c) => c.name === command.name),
			);

			for (const newCommand of newCommands) {
				client.logger.info(`Adding slash command: ${newCommand.name}`);
				await client.application?.commands.create(newCommand, guildID);
			}

			const deletedCommands = currentCommands
				.filter(
					(command) => !commands.some((c) => c.name === command.name),
				)
				.toJSON();

			for (const deletedCommand of deletedCommands) {
				client.logger.info(
					`Deleting slash command: ${deletedCommand.name}`,
				);
				await deletedCommand.delete();
			}

			const updatedCommands = commands.filter((command) =>
				currentCommands.some((c) => c.name === command.name),
			);

			for (const updatedCommand of updatedCommands) {
				if (updatedCommand.type === 'CHAT_INPUT') {
					const previousCommand = currentCommands.find(
						(c) => c.name === updatedCommand.name,
					);

					if (!previousCommand) {
						continue;
					}

					let modified = false;

					if (
						previousCommand.description !==
						updatedCommand.description
					) {
						modified = true;
					}

					if (
						!ApplicationCommand.optionsEqual(
							previousCommand.options ?? [],
							updatedCommand.options ?? [],
						)
					) {
						modified = true;
					}

					if (modified) {
						client.logger.info(
							`Updating slash command: ${updatedCommand.name}`,
						);
						await previousCommand.edit(updatedCommand);
					}
				}
			}

			this.client.logger.info(`[dispatcher] Slash commands synced!`);
		}
	}

	private exitStrategy(user_id: string) {
		this.awaiting.delete(user_id);
	}

	public async load() {
		if (this.loaded)
			throw new DisclosureError(`Dispatcher already loaded.`);

		this.client.logger.info(`[dispatcher] loading...`);
		this.loaded = true;

		await this.sync();

		this.client.logger.info(`[dispatcher] listening to events...`);
		this.client.on('interactionCreate', async (interaction) => {
			if (
				interaction.user.bot ||
				this.awaiting.has(interaction.user.id) ||
				!interaction.isCommand()
			) {
				return;
			}

			const command = this.client.commands.get(interaction.commandName);

			if (!command) {
				return;
			}

			this.awaiting.add(interaction.user.id);

			if (await this.inihibit(interaction, command)) {
				return this.exitStrategy(interaction.user.id);
			}

			try {
				await command.exec(interaction);

				if (typeof command.plugin.onCommand === 'function') {
					await command.plugin.onCommand(interaction, command);
				}
			} catch (err) {
				this.client.logger
					.error(
						`[plugin:${command.plugin.metadata.name}] Error occured - Command '${interaction.commandName}'`,
					)
					.error(err);

				if (typeof command.plugin.onCommandError === 'function') {
					command.plugin.onCommandError(interaction, command, err);
				}
			} finally {
				this.exitStrategy(interaction.user.id);
			}
		});

		this.client.logger.info(`[dispatcher] loaded`);
	}
}
