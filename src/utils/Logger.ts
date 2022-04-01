import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { createLogger } from '@oadpoaw/utils/createLogger';

const Logger = createLogger([
	new DailyRotateFile({
		filename: `logs${path.sep}%DATE%.log`,
		datePattern: 'YYYY-MM-DD-HH',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		createSymlink: true,
		symlinkName: 'latest.log',
	}),
	new DailyRotateFile({
		level: 'warn',
		filename: `logs${path.sep}errors${path.sep}%DATE%.log`,
		datePattern: 'YYYY-MM-DD-HH',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		createSymlink: true,
		symlinkName: 'latest.log',
	}),
]);

export default Logger;
