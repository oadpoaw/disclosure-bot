import Logger from './Logger.js';
import { ShardingManager } from 'discord.js';
import { shardOptions } from '../config.js';
import { Config } from './Config.js';
import ms from 'ms';

(async function Start() {
	const startingTime = Date.now();

	const manager = new ShardingManager('./dist/Disclosure.js', {
		...shardOptions,
		token: Config.token,
	});

	manager.on('shardCreate', (shard) => {
		shard.on('ready', async () => {
			await shard.eval(`this.plugins.initialize();`);

			if (shard.id === 0) {
				await shard.eval(`this.dispatcher.initialize();`);
			} else {
				Logger.info(
					`[ShardingManager] [ID: ${shard.id}] [PID: ${shard.process?.pid}] ready!`,
				);
			}
		});

		shard.on('spawn', (child) => {
			Logger.info(
				`[ShardingManager] [ID: ${shard.id}] [PID: ${child.pid}] spawned`,
			);
		});

		shard.on('death', (child) => {
			Logger.error(
				`[ShardingManager] [ID: ${shard.id}] [PID: ${child.pid}] died`,
			);
		});

		shard.on('disconnect', () => {
			Logger.warn(
				`[ShardingManager] [ID: ${shard.id}] [PID: ${shard.process?.pid}] disconnected`,
			);
		});

		shard.on('error', (error) => {
			Logger.error(
				`[ShardingManager] [ID: ${shard.id}] [PID :${shard.process?.pid}] error:`,
			);
			Logger.error(error);
		});

		Logger.info(`[ShardingManager] [ID: ${shard.id}] created`);
	});

	Logger.info(`[ShardingManager] Spawning shards...`);
	await manager.spawn();

	Logger.info(`Done! ${ms(Date.now() - startingTime)}`);
})();
