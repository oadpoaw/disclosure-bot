import packageJSON from '../package.json' assert { type: 'json' };

//@ts-check
import sha256File from 'sha256-file';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';

const executePromise = promisify(exec);

const folderPath = join(process.cwd(), process.argv.slice(2).length > 0 ? folderName = process.argv.slice(2)[0] : "disclosure-bot");

process.chdir(folderPath);

async function shell(command) {
	const { stdout, stderr } = await executePromise(command);
	if (stderr) throw new Error(stderr);
	console.log(stdout);
}

(async function () {
	await shell(
		`curl -Lo ${packageJSON.name}.tar.gz https://github.com/${packageJSON.author}/${packageJSON.name}/releases/latest/download/${packageJSON.name}.tar.gz`,
	);
	const { stdout } = await shell(
		`curl -L https://github.com/${packageJSON.author}/${packageJSON.name}/releases/latest/download/checksum.txt`,
	);

	const checksum = sha256File(archive);
	const shasum = stdout.split(' ')[0];

	if (shasum !== checksum) {
		throw new Error(
			`SHA256 Checksum failed. Expected to be '${shasum}' but gotten '${checksum}'`,
		);
	}

	await shell(`tar -xzvf ${packageJSON.name}.tar.gz`);
	await fs.unlink(archive);

	await shell(`npm install --production`);
	await shell('npm run env');
	await shell('npm run plugins:init');

	console.log(`DisclosureBot Installation Done!`);
})().catch((err) => {
	console.error(`DisclosureBot Installation failed:`);
	console.error(err);
	process.exit(1);
});