import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, sep } from 'path';

const makePath = (p = '') => join(process.cwd(), 'plugins', p);

for (const file of readdirSync(makePath('plugins'))) {
	if (file.endsWith('.js')) {
		const buffer = readFileSync(makePath(`plugins${sep}${file}`));
		writeFileSync(makePath(file), buffer.toString());
	}
}

import './prebuild-plugins.js';