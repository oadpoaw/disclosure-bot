const rimraf = require('rimraf');
const path = require('path');

const log = (err) => err && console.error(err);
const makePath = (p = '') => path.join(process.cwd(), 'plugins', p);

rimraf(makePath('plugins'), log);
rimraf(makePath('src'), log);
rimraf(makePath('package.json'), log);
rimraf(makePath('plugin.tsconfig.tsbuildinfo'), log);
