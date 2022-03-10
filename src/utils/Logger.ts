import { createLogger } from '@oadpoaw/utils';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';
import BotConfig from '../loaders/BotConfig';

const config = BotConfig();

const Logger = createLogger([
	new DailyRotateFile({
		filename: `logs${path.sep}%DATE%-${process.pid}.log`,
		datePattern: 'YYYY-MM-DD-HH',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		createSymlink: !config.bot.sharding,
		symlinkName: 'latest.log',
	}),
	new DailyRotateFile({
		level: 'warn',
		filename: `logs${path.sep}errors${path.sep}%DATE%-${process.pid}.log`,
		datePattern: 'YYYY-MM-DD-HH',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		createSymlink: !config.bot.sharding,
		symlinkName: 'latest.log',
	}),
]);

export default Logger;
