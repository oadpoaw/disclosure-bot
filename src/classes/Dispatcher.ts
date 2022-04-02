import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import type { CacheType, Client, CommandInteraction } from 'discord.js';
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

			const rest = new REST({ version: '9' }).setToken(this.client.token);

			const route =
				typeof guildId === 'string'
					? Routes.applicationGuildCommands(
							this.client.user.id,
							guildId,
					  )
					: Routes.applicationCommands(this.client.user.id);

			await rest.put(route, {
				body: this.client.commands.map(({ slash }) => slash.toJSON()),
			});

			const commands = await this.client.application.commands.fetch({
				guildId,
			});

			for (const [, command] of commands) {
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
