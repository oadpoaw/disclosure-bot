import fs from 'fs';
import path from 'path';

export function writeFile(
	paths,
	buffer,
) {
	fs.writeFileSync(path.join(process.cwd(), ...paths), buffer);
}

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
};`,
);