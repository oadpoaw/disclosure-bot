import ms from 'ms';
import { CommandInteraction, Permissions } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import type { PermissionResolvable } from 'discord.js';

export interface CommandConfig {
	/**
	 * The Category of the command.
	 */
	category?: string;

	/**
	 * The Cooldown of the command.
	 */
	cooldown?: string;

	/**
	 * The required permissions to execute the command by the user.
	 */
	userPermissions?: PermissionResolvable;

	/**
	 * The required permissions to execute the command by the bot.
	 */
	clientPermissions?: PermissionResolvable;

	/**
	 * Whether this command can be only be executed by the bot owner
	 */
	ownerOnly?: boolean;
}

type BuilderFunction = (command: SlashCommandBuilder) => SlashCommandBuilder;
type ExecuteFunction = (interaction: CommandInteraction) => any;

export default class Command {
	public readonly command: SlashCommandBuilder;

	public constructor(
		builder: BuilderFunction,
		public readonly exec: ExecuteFunction,
		public readonly config: CommandConfig,
	) {
		this.command = builder(new SlashCommandBuilder());
	}

	public get name() {
		return this.command.name;
	}

	public get description() {
		return this.command.description;
	}

	public get category() {
		return this.config.category;
	}

	public get cooldown() {
		return this.config.cooldown ? ms(this.config.cooldown) : 3000;
	}

	public get userPermissions() {
		return this.config.userPermissions
			? new Permissions(this.config.userPermissions)
			: false;
	}

	public get clientPermissions() {
		return this.config.clientPermissions
			? new Permissions(this.config.clientPermissions)
			: false;
	}

	public get ownerOnly() {
		return this.config.ownerOnly || false;
	}
}
