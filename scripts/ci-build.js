import { writeFile } from '@oadpoaw/utils/fs/sync';

writeFile(
	['config.js'],
	`// @ts-check

	import { Intents } from 'discord.js';
	
	/**
	 * @type {import('discord.js').ClientOptions}
	 */
	export const clientOptions = {
		intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
	};
	
	/**
	 * @type {import('discord.js').ShardingManagerOptions}
	 */
	export const shardOptions = {
		totalShards: 'auto',
		respawn: true,
	};
	
`,
);