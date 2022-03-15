import rimraf from 'rimraf';
import { join } from 'path';

const log = (err) => err && console.error(err);
const makePath = (p = '') => join(process.cwd(), 'plugins', p);

rimraf(makePath('plugins'), log);
rimraf(makePath('src'), log);
rimraf(makePath('plugin.tsconfig.tsbuildinfo'), log);
