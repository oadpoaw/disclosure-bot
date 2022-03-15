#!/usr/bin/env node
if (Number(process.versions.node.split('.')[0]) < 17) {
	throw new Error(`DisclosureBot only supports Node.js 17 and above`);
}

import { name as _name, author } from './package.json' assert { type: 'json' };

import sha256File from 'sha256-file';
import { exec } from 'child_process';
import { promises as fs, mkdirSync } from 'fs';
import { promisify } from 'util';
import { join } from 'path';

const shell = promisify(exec);

const folderPath = join(process.cwd(), process.argv.slice(2).length > 0 ? folderName = process.argv.slice(2)[0] : "disclosure-bot");

mkdirSync(folderPath);
process.chdir(folderPath);

const name = _name.slice(7);

(async function () {
	await shell(
		`curl -Lo ${name}.tar.gz https://github.com/${author}/${name}/releases/latest/download/${name}.tar.gz`,
	);
	const { stdout } = await shell(
		`curl -L https://github.com/${author}/${name}/releases/latest/download/checksum.txt`,
	);

	const checksum = sha256File(`${name}.tar.gz`);
	const shasum = stdout.split(' ')[0];

	if (shasum !== checksum) {
		throw new Error(
			`SHA256 Checksum failed. Expected to be '${shasum}' but gotten '${checksum}'`,
		);
	}

	await shell(`tar -xzvf ${name}.tar.gz`);
	await fs.unlink(`${name}.tar.gz`);

	await shell(`npm install --production`);
	await shell('npm run env');
	await shell('npm run plugins:init');

	console.log(`DisclosureBot Installation Done!`);
})().catch((err) => {
	console.error(`DisclosureBot Installation failed:`);
	console.error(err);
	process.exit(1);
});