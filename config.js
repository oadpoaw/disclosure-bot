// @ts-check

const { Intents } = require('discord.js');

/**
 * @type {import('discord.js').ClientOptions}
 */
const clientOptions = {
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};

/**
 * @type {import('discord.js').ShardingManagerOptions}
 */
const shardOptions = {
	totalShards: 'auto',
	respawn: true,
};

module.exports = { clientOptions, shardOptions };