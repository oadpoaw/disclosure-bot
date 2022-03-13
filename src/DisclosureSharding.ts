import { ShardingManager } from 'discord.js';
import Logger from './utils/Logger.js';
import BotConfig from './loaders/BotConfig.js';
import { shardOptions } from '../config.js';

const manager = new ShardingManager('./dist/Disclosure.js', {
	...shardOptions,
	token: BotConfig().bot.token,
});

manager.on('shardCreate', (shard) => {
	shard.on('ready', () => {
		Logger.info(`[shard][${shard.process?.pid}][${shard.id}] ready!`);
	});

	shard.on('spawn', (child) => {
		Logger.info(`[shard][${child.pid}][${shard.id}] spawned`);
	});

	shard.on('death', (child) => {
		Logger.error(`[shard][${child.pid}][${shard.id}] died`);
	});

	shard.on('disconnect', () => {
		Logger.warn(`[shard][${shard.process?.pid}][${shard.id}] disconnected`);
	});

	shard.on('error', (error) => {
		Logger.error(`[shard][${shard.process?.pid}][${shard.id}] error:`);
		Logger.error(error);
	});

	Logger.info(`[shard][...][${shard.id}] created`);
});

manager.spawn();
