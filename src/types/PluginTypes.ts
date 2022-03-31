import type {
	ApplicationCommandPermissionData,
	ClientEvents,
	CommandInteraction,
} from 'discord.js';
import type z from 'zod';
import type { SlashCommandBuilder } from '@discordjs/builders';
import type { Plugin } from '../structures/Plugin';
import type { PluginMetaData } from '../structures/PluginMetaData';

export type InhibitorFunction = (
	interaction: CommandInteraction,
	command: Command,
) => boolean | Promise<boolean>;

export type BuilderFunction = (
	command: SlashCommandBuilder,
) => SlashCommandBuilder;

export type ExecuteFunction = (interaction: CommandInteraction) => any;

export type EventListener<K extends keyof ClientEvents> = (
	...args: ClientEvents[K]
) => any;

type PluginValidation = z.ZodObject<any, 'strip', z.ZodTypeAny, {}, {}>;

interface Config<T extends PluginValidation = PluginValidation> {
	config: z.infer<T>;
	validation: T;
}

type PluginConfiguration = Record<string, Config>;

export interface PluginParam<
	C extends PluginConfiguration = PluginConfiguration,
> {
	metadata: PluginMetaData;
	configuration: C;
}

interface CommandOptions {
	name: string;
	description: string;
	permissions?: ApplicationCommandPermissionData[];
	options?: BuilderFunction;
}

export interface Command {
	plugin: Plugin;
	slash: SlashCommandBuilder;
	execute: ExecuteFunction;
	options: CommandOptions;
}
