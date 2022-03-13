import BotConfig from '../loaders/BotConfig.js';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { createLogger } from '@oadpoaw/utils';

const config = BotConfig();

const Logger = createLogger([
	new DailyRotateFile({
		filename: `logs${path.sep}%DATE%${
			config.bot.sharding ? `-${process.pid}` : ''
		}.log`,
		datePattern: 'YYYY-MM-DD-HH',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		createSymlink: !config.bot.sharding,
		symlinkName: 'latest.log',
	}),
	new DailyRotateFile({
		level: 'warn',
		filename: `logs${path.sep}errors${path.sep}%DATE%${
			config.bot.sharding ? `-${process.pid}` : ''
		}.log`,
		datePattern: 'YYYY-MM-DD-HH',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		createSymlink: !config.bot.sharding,
		symlinkName: 'latest.log',
	}),
]);

export default Logger;
