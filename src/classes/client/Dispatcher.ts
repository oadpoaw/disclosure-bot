import type Command from '../plugin/Command.js';
import {
	ApplicationCommand,
	ApplicationCommandDataResolvable,
	Client,
	Collection,
	GuildResolvable,
	Interaction,
} from 'discord.js';
import DisclosureError from '../DisclosureError.js';
import type { Inhibitor } from '../plugin/Inhibitor.js';

export default class Dispatcher {
	public readonly awaiting: Set<string>;
	public readonly inhibitors: Inhibitor[];

	private registered: boolean;

	public constructor(private client: Client) {
		this.awaiting = new Set();
		this.inhibitors = [];
		this.registered = false;
	}

	private async inihibit(interaction: Interaction, command: Command) {
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

	private async updateSlashCommands() {
		const client = this.client;

		if (
			(client.shard?.ids.includes(0) || !client.config.bot.sharding) &&
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

			for (const newCommand of newCommands)
				await client.application?.commands.create(newCommand, guildID);

			const deletedCommands = currentCommands
				.filter(
					(command) => !commands.some((c) => c.name === command.name),
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
						await previousCommand.edit(updatedCommand);
					}
				}
			}
		}
	}

	public async register() {
		if (this.registered)
			throw new DisclosureError(`Dispatcher already registered.`);

		this.registered = true;

		await this.updateSlashCommands();

		this.client.on('interactionCreate', async (interaction) => {
			if (
				interaction.user.bot ||
				this.awaiting.has(interaction.user.id) ||
				!interaction.isCommand()
			) {
				return;
			}

			this.awaiting.add(interaction.user.id);

			const command = this.client.commands.get(interaction.commandName);

			if (!command) {
				return;
			}

			if (await this.inihibit(interaction, command)) {
				return;
			}
			try {
				await command.exec(interaction);

				if (typeof command.plugin.onCommand === 'function') {
					command.plugin.onCommand(interaction, command);
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
				this.awaiting.delete(interaction.user.id);
			}
		});
	}
}
