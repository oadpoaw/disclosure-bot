#!/usr/bin/env node
if (Number(process.versions.node.split('.')[0]) < 17) {
	throw new Error(`DisclosureBot only supports Node.js 17 and above`);
}

const packageJSON = require('./package.json');

//@ts-check
const sha256File = require('sha256-file');
const { exec } = require('child_process');
const { promises: fs, mkdirSync } = require('fs');
const { promisify } = require('util');
const { join } = require('path');

const execute = promisify(exec);

const folderPath = join(process.cwd(), process.argv.slice(2).length > 0 ? folderName = process.argv.slice(2)[0] : "disclosure-bot");

mkdirSync(folderPath);
process.chdir(folderPath);

(async function () {
	await execute(
		`curl -Lo ${packageJSON.name}.tar.gz https://github.com/${packageJSON.author}/${packageJSON.name}/releases/latest/download/${packageJSON.name}.tar.gz`,
	);
	const { stdout } = await execute(
		`curl -L https://github.com/${packageJSON.author}/${packageJSON.name}/releases/latest/download/checksum.txt`,
	);

	const checksum = sha256File(archive);
	const shasum = stdout.split(' ')[0];

	if (shasum !== checksum) {
		throw new Error(
			`SHA256 Checksum failed. Expected to be '${shasum}' but gotten '${checksum}'`,
		);
	}

	await execute(`tar -xzvf ${packageJSON.name}.tar.gz`);
	await fs.unlink(archive);

	await execute(`npm install --production`);
	await execute('npm run env');
	await execute('npm run plugins:init');

	console.log(`DisclosureBot Installation Done!`);
})().catch((err) => {
	console.error(`DisclosureBot Installation failed:`);
	console.error(err);
	process.exit(1);
});