import yaml from 'yaml';
import z from 'zod';
import { readFile } from '@oadpoaw/utils/fs/sync';

const ConfigValidator = z.object({
	environment: z.enum(['development', 'production']),
	token: z.string().min(59, `The Token should be a valid Discord Bot Token.`),
	main_guild: z.string(),
	multiguild: z.boolean(),
	sharding: z.boolean(),
});

export interface ConfigInterface extends z.infer<typeof ConfigValidator> {
	/**
	 * - Whether the bot is running on production.
	 * - If `development`, it will sync the slash commands into a single guild which is defined in property `main_guild` below.
	 * - If `production`, it will sync the slash commands globally unless `multiguild` property is set to `false` so the slash commands will only be synced into a single guild which is defined in property `main_guild` below.
	 */
	environment: 'development' | 'production';
	/**
	 * - Bot's token that will be used to authenticate to the Discord API.
	 */
	token: string;
	/**
	 * - The Main Server/Guild of the Bot.
	 * - This is a string of a Guild/Server ID.
	 * - This is also where slash commands will be synced during `development` which is specified in property `environment`.
	 * - This property is ignored when property `environment` is set to `production` and if property `multiguild` is set to `true`
	 */
	main_guild: string;
	/**
	 * - Whether the bot can/should run in multiple discord servers.
	 * - This property is ignored when property `environment` is set to `development` unless property `sharding` is set to `true`
	 */
	multiguild: boolean;
	/**
	 * - Whether the bot should enable sharding.
	 * - This property is ignored when property `multiguild` is set to `false`
	 * - See more at {@link https://discordjs.guide/sharding/}
	 */
	sharding: boolean;
}

export const Config: ConfigInterface = BotConfig();

export function BotConfig(): ConfigInterface {
	return ConfigValidator.parse(
		yaml.parse(readFile(['config.yml']).toString()),
	);
}
