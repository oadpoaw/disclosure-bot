import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { createLogger } from '@oadpoaw/utils/createLogger';
import { processor } from '@oadpoaw/utils';
import { Config } from './Config.js';

const Logger = createLogger([
	new DailyRotateFile({
		filename: `logs${path.sep}%DATE%%${
			Config.sharding ? `-${process.pid}` : ''
		}.log`,
		datePattern: 'YYYY-MM-DD-HH',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		createSymlink: !Config.sharding,
		symlinkName: 'latest.log',
	}),
	new DailyRotateFile({
		level: 'warn',
		filename: `logs${path.sep}errors${path.sep}%DATE%${
			Config.sharding ? `-${process.pid}` : ''
		}.log`,
		datePattern: 'YYYY-MM-DD-HH',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		createSymlink: !Config.sharding,
		symlinkName: 'latest.log',
	}),
]);

processor(Logger);

export default Logger;
