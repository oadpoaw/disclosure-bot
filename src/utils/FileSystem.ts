import fs from 'fs';
import path from 'path';

export function writeFile(
	paths: string[],
	buffer: string | NodeJS.ArrayBufferView,
) {
	fs.writeFileSync(path.join(process.cwd(), ...paths), buffer);
}

export function readFile(paths: string[]) {
	return fs.readFileSync(path.join(process.cwd(), ...paths));
}

export function existsFile(paths: string[]) {
	try {
		return fs.statSync(path.join(process.cwd(), ...paths)).isFile();
	} catch (err) {
		return false;
	}
}

export function stat(paths: string[]) {
	try {
		return fs.statSync(path.join(process.cwd(), ...paths));
	} catch (err) {
		return false;
	}
}

export function readdir(paths: string[]) {
	return fs.readdirSync(path.join(process.cwd(), ...paths));
}

export function mkdir(paths: string[]) {
	fs.mkdirSync(path.join(process.cwd(), ...paths));
}

export function existsDirectory(paths: string[]) {
	try {
		return fs.statSync(path.join(process.cwd(), ...paths)).isDirectory();
	} catch (err) {
		return false;
	}
}
