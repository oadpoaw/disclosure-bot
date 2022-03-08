import { version } from '../../package.json';
import Config from '../Config.json';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import sha256File from 'sha256-file';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import Logger from '../utils/Logger';

const execute = promisify(exec);

(async function () {
	const response = await fetch(
		`https://api.github.com/repos/${Config.owner}/${Config.repository}/releases/latest`,
	);
	const json = (await response.json()) as { tag_name: string };

	if (`v${version}` === json.tag_name) {
		throw new Error(`Everything is up-to-date.`);
	}

	await fs.unlink(path.join(process.cwd(), 'src', 'core')).catch(() => {});
	await fs
		.unlink(path.join(process.cwd(), 'src', 'index.ts'))
		.catch(() => {});

	const archive = path.join(process.cwd(), Config.filename);

	await execute(
		`curl -Lo ${Config.filename} https://github.com/${Config.owner}/${Config.repository}/releases/latest/download/${Config.filename}`,
	);
	const { stdout } = await execute(
		`curl -L https://github.com/${Config.owner}/${Config.repository}/releases/latest/download/checksum.txt`,
	);

	const checksum = sha256File(archive);
	const shasum = stdout.split(' ')[0];

	if (shasum !== checksum) {
		throw new Error(
			`SHA256 Checksum failed. Expected to be '${shasum}' but gotten '${checksum}'`,
		);
	}

	await execute(`tar -xzvf ${Config.filename}`);
	await fs.unlink(archive);

	await execute(`npm install --production`);

	Logger.info('Updated.');
})().catch((err) => {
	Logger.error(err);
	process.exit(1);
});
