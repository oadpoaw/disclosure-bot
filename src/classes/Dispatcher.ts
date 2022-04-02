import {
	ApplicationCommand,
	ApplicationCommandData,
	CacheType,
	Client,
	CommandInteraction,
} from 'discord.js';
import type { Command, InhibitorFunction } from '../types';

export default class Dispatcher {
	public readonly awaiting: Set<string>;
	public readonly inhibitors: InhibitorFunction[];

	private init: boolean;

	public constructor(private client: Client<true>) {
		this.awaiting = new Set();
		this.inhibitors = [];
		this.init = false;
	}

	private async sync() {
		if (this.client.commands.size) {
			let guildId: string | undefined | false;

			const isDevelopment =
				this.client.config.environment === 'development';

			const isProduction = !isDevelopment;

			const isMultiGuild = this.client.config.multiguild;

			if (isDevelopment) {
				guildId = this.client.config.main_guild;
			}

			if (isDevelopment && isMultiGuild && !!this.client.shard) {
				if (this.client.shard.ids.includes(0)) {
					guildId = undefined;
				} else {
					guildId = false;
				}
			}

			if (isProduction && isMultiGuild) {
				guildId = undefined;
			}

			if (isProduction && !isMultiGuild) {
				guildId = this.client.config.main_guild;
			}

			if (isProduction && isMultiGuild && !!this.client.shard) {
				if (this.client.shard.ids.includes(0)) {
					guildId = undefined;
				} else {
					guildId = false;
				}
			}

			if (typeof guildId === 'boolean') return;

			this.client.logger.info(`[Dispatcher] Syncing slash commands...`);

			if (!this.client.application?.owner) {
				await this.client.application?.fetch();
			}

			const commands = this.client.commands.map(({ slash }) =>
				slash.toJSON(),
			);

			const current_commands =
				await this.client.application.commands.fetch({
					guildId,
				});

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
					`- Adding slash command: ${new_command.name}`,
				);

				await this.client.application?.commands.create(
					new_command,
					guildId,
				);
			}

			for (const deleted_command of deleted_commands) {
				this.client.logger.info(
					`- Deleting slash command: ${deleted_command.name}`,
				);
				await deleted_command.delete();
			}

			for (const updated_command of updated_commands) {
				if (updated_command.type === 1) {
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
						previous_command.defaultPermission !==
						updated_command.default_permission
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
							`- Updating slash command: ${updated_command.name}`,
						);

						await previous_command.edit({
							...updated_command,
							type: 'CHAT_INPUT',
						} as ApplicationCommandData);
					}

					const { options } = this.client.commands.get(
						previous_command.name,
					) as Command;

					if (
						options.permissions &&
						options.permissions.length &&
						guildId
					) {
						const { permissions } = options;

						const current_permissions =
							await previous_command.permissions.fetch({
								guild: guildId,
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
								guild: guildId,
								permissions,
							});
						}
					}
				}
			}

			for (const [, command] of current_commands) {
				const { options } = this.client.commands.get(
					command.name,
				) as Command;

				if (
					options.permissions &&
					options.permissions.length &&
					guildId
				) {
					const { permissions } = options;

					const current_permissions = await command.permissions.fetch(
						{
							guild: guildId,
						},
					);

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
						command.permissions.set({
							guild: guildId,
							permissions,
						});
					}
				}
			}

			this.client.logger.info(`[Dispatcher] Slash commands synced!`);
		}
	}

	private async inihibit(
		interaction: CommandInteraction<CacheType>,
		command: Command,
	) {
		for (const inhibitor of this.inhibitors) {
			if (!(await Promise.resolve(inhibitor(interaction, command)))) {
				return true;
			}
		}
		return false;
	}

	public async initialize() {
		if (this.init) {
			throw new Error(`Dispatcher has already been initialized.`);
		}

		this.init = true;

		this.client.logger.info(`[Dispatcher] Initializing...`);

		await this.sync();

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

		this.client.logger.info(`[Dispatcher] Initialized.`);
	}
}
