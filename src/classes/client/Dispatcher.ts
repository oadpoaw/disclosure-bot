import {
	ApplicationCommand,
	ApplicationCommandDataResolvable,
	CacheType,
	Client,
	Collection,
	CommandInteraction,
	Guild,
	GuildResolvable,
} from 'discord.js';
import type { Command, InhibitorFunction } from '../../types/PluginTypes.js';

export default class Dispatcher {
	public readonly awaiting: Set<string>;
	public readonly inhibitors: InhibitorFunction[];

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
			let status = inhibitor(interaction, command);

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
		const guild = this.client.guilds.cache.first() as Guild;

		if (this.client.commands.size && Boolean(guild)) {
			this.client.logger.info(`[dispatcher] Syncing slash commands...`);

			if (!this.client.application?.owner) {
				await this.client.application?.fetch();
			}

			const commands = this.client.commands.map(({ slash }) => ({
				name: slash.name,
				description: slash.description,
				options: slash.options,
				type: 'CHAT_INPUT',
			})) as unknown as ApplicationCommandDataResolvable[];

			const current_commands =
				(await this.client.application?.commands.fetch({
					guildId: guild.id,
				})) as Collection<
					string,
					ApplicationCommand<{
						guild?: GuildResolvable;
					}>
				>;

			const new_commands = commands.filter(
				(command) =>
					!current_commands.some((c) => c.name === command.name),
			);

			const deleted_commands = current_commands
				.filter(
					(command) => !commands.some((c) => c.name === command.name),
				)
				.toJSON();

			const updated_commands = commands.filter((command) =>
				current_commands.some((c) => c.name === command.name),
			);

			for (const new_command of new_commands) {
				this.client.logger.info(
					`Adding slash command: ${new_command.name}`,
				);

				await this.client.application?.commands.create(
					new_command,
					guild.id,
				);
			}

			for (const deleted_command of deleted_commands) {
				this.client.logger.info(
					`Deleting slash command: ${deleted_command.name}`,
				);
				await deleted_command.delete();
			}

			for (const updated_command of updated_commands) {
				if (updated_command.type === 'CHAT_INPUT') {
					const previous_command = current_commands.find(
						(c) => c.name === updated_command.name,
					);

					if (!previous_command) {
						continue;
					}

					let modified = false;

					if (
						previous_command.description !==
						updated_command.description
					) {
						modified = true;
					}

					if (
						!ApplicationCommand.optionsEqual(
							previous_command.options ?? [],
							updated_command.options ?? [],
						)
					) {
						modified = true;
					}

					if (modified) {
						this.client.logger.info(
							`Updating slash command: ${updated_command.name}`,
						);
						await previous_command.edit(updated_command);
					}

					const { options } = this.client.commands.get(
						previous_command.name,
					) as Command;

					if (options.permissions && options.permissions.length) {
						const { permissions } = options;

						const current_permissions =
							await previous_command.permissions.fetch({
								guild: guild.id,
							});

						const new_permissions = permissions.filter(
							(permission) =>
								!current_permissions.some(
									(p) =>
										p.id === permission.id &&
										p.type === permission.type,
								),
						);

						const deleted_permissions = current_permissions.filter(
							(permission) =>
								!permissions.some(
									(p) =>
										p.id === permission.id &&
										p.type === permission.type,
								),
						);

						const updated_permissions = permissions.filter(
							(permission) =>
								current_permissions.some(
									(p) =>
										p.id === permission.id &&
										p.type === permission.type &&
										p.permission !== permission.permission,
								),
						);

						if (
							new_permissions.length ||
							deleted_permissions.length ||
							updated_permissions.length
						) {
							previous_command.permissions.set({
								guild: guild.id,
								permissions,
							});
						}
					}
				}
			}

			this.client.logger.info(`[dispatcher] Slash commands synced!`);
		}
	}

	public async load() {
		if (this.loaded) {
			throw new Error(`Dispatcher already loaded.`);
		}

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

			if (!(await this.inihibit(interaction, command))) {
				await command.execute(interaction);
			}

			this.awaiting.delete(interaction.user.id);
		});

		this.client.logger.info(`[dispatcher] loaded`);
	}
}
