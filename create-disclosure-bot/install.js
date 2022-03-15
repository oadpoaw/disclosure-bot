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

const fileName = `${name}.tar.gz`;

(async function () {
	console.log('Starting installation.');

	console.time('download');
	const fileUrl = `curl -Lo ${name}.tar.gz https://github.com/${author}/${name}/releases/latest/download/${fileName}`;
	console.log(`Downloading ${fileName} from ${fileUrl.split(' ')[3]}`);
	await shell(fileUrl);
	console.timeEnd('download');

	console.log(`Verifying ${fileName} SHA256 Checksum...`);
	const { stdout } = await shell(
		`curl -L https://github.com/${author}/${name}/releases/latest/download/checksum.txt`,
	);

	const checksum = sha256File(fileName);
	const shasum = stdout.split(' ')[0];

	if (shasum !== checksum) {
		throw new Error(
			`SHA256 Checksum failed. Expected to be '${shasum}' but gotten '${checksum}'`,
		);
	}

	console.log(`${fileName} checksum verified!`);

	console.time('unpack');
	console.log(`Unpacking ${fileName}...`);
	const { stdout: o } = await shell(`tar -xzvf ${name}.tar.gz`);
	await fs.unlink(fileName);
	console.log(o);
	console.timeEnd('unpack');

	console.time('deps');
	console.log(`Installing Dependencies...`);
	await shell(`npm install --production`);
	console.timeEnd('deps');

	await shell('npm run env');
	await shell('npm run plugins:init');

	console.log(`DisclosureBot Installation Done!`);
})().catch((err) => {
	console.error(`DisclosureBot Installation failed:`);
	console.error(err);
	process.exit(1);
});