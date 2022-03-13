import type Plugin from '#disclosure/Plugin';
import type Command from './Command.js';
import type { Client, Interaction } from 'discord.js';

export type InhibitorFunction = (
	i: Interaction,
	c: Command,
) => boolean | Promise<boolean>;

export class Inhibitor {
	public constructor(
		/**
		 * - The client who instantiated the inhibitor.
		 */
		public client: Client,
		/**
		 * - The plugin who created the inhibitor.
		 */
		public plugin: Plugin,
		/**
		 * - The function that inhibits the command.
		 * - Return `true` to continue executing the command.
		 * - Return `false` to discontinue executing the command.
		 */
		public inhibitor: InhibitorFunction,
	) {}
}
