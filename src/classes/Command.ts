import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import type Plugin from '@disclosure/Plugin';

export type BuilderFunction = (
	command: SlashCommandBuilder,
) => SlashCommandBuilder;
export type ExecuteFunction = (interaction: CommandInteraction) => any;

export default class Command {
	public readonly command: SlashCommandBuilder;

	public constructor(
		/**
		 * - The plugin who instantiated the command.
		 */
		public readonly plugin: Plugin,
		builder: BuilderFunction,
		public readonly exec: ExecuteFunction,
	) {
		this.command = builder(new SlashCommandBuilder());
	}

	public get name() {
		return this.command.name;
	}

	public get description() {
		return this.command.description;
	}
}
