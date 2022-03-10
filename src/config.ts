import { ClientOptions, Intents, ShardingManagerOptions } from 'discord.js';

export const clientOptions: ClientOptions = {
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};

export const shardOptions: ShardingManagerOptions = {
	totalShards: 'auto',
	respawn: true,
};
