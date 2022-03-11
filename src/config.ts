import type { ClientOptions, ShardingManagerOptions } from 'discord.js';
import path from 'path';

type Config = {
	clientOptions: ClientOptions;
	shardOptions: ShardingManagerOptions;
};

export default function config(): Config {
	return require(path.join(process.cwd(), 'config.js'));
}
