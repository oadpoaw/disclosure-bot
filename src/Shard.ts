import { ShardingManager } from 'discord.js';
import Logger from './utils/Logger';
import { shardOptions } from '../config';
import BotConfig from 'loaders/BotConfig';

const manager = new ShardingManager('./src/Bot.ts', {
	...shardOptions,
	token: BotConfig().bot.token,
	execArgv: ['node_modules/ts-node/dist/bin.js', '--transpileOnly'],
});

manager.on('shardCreate', (shard) => {
	shard
		.on('ready', () => {
			Logger.info(`[shard][${shard.process?.pid}][${shard.id}] ready!`);
		})
		.on('spawn', (child) => {
			Logger.info(`[shard][${child.pid}][${shard.id}] spawned`);
		})
		.on('death', (child) => {
			Logger.error(`[shard][${child.pid}][${shard.id}] died`);
		})
		.on('disconnect', () => {
			Logger.warn(
				`[shard][${shard.process?.pid}][${shard.id}] disconnected`,
			);
		})
		.on('error', (error) => {
			Logger.error(`[shard][${shard.process?.pid}][${shard.id}] error:`);
			Logger.error(error);
		});

	Logger.info(`[shard][...][${shard.id}] created`);
});

manager.spawn();
