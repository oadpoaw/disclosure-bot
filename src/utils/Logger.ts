import { createLogger } from '@oadpoaw/utils';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

const dailyTransport: DailyRotateFile = new DailyRotateFile({
	filename: `logs${path.sep}%DATE%.log`,
	datePattern: 'YYYY-MM-DD-HH-mm-ss',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d',
	createSymlink: true,
	symlinkName: 'latest.log',
});

const errorTransport: DailyRotateFile = new DailyRotateFile({
	level: 'warn',
	filename: `logs${path.sep}errors${path.sep}%DATE%.log`,
	datePattern: 'YYYY-MM-DD-HH-mm-ss',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d',
	createSymlink: true,
	symlinkName: 'latest.log',
});

const Logger = createLogger([dailyTransport, errorTransport]);

export default Logger;
