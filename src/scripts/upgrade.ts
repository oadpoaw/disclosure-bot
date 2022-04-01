import fetch from 'node-fetch';
import packageJSON from '../../package.json';
import path from 'path';
import sha256File from 'sha256-file';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import rimraf from 'rimraf';

const execute = promisify(exec);

(async function Upgrade() {
	const response = await fetch(
		`https://api.github.com/repos/${packageJSON.author}/${packageJSON.name}/releases/latest`,
	);

	const json = (await response.json()) as { tag_name: string };

	if (`v${packageJSON.version}` === json.tag_name) {
		throw new Error(`Everything is up-to-date.`);
	}

	await new Promise((resolve) => rimraf('dist', resolve));

	const archive = path.join(process.cwd(), `${packageJSON.name}.tar.gz`);

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

	await execute(`npm install`);

	console.log('Updated.');
	console.log(
		'For changelogs, see: https://github.com/oadpoaw/disclosure-bot/blob/main/CHANGELOG.md',
	);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
