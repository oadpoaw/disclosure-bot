import { join } from 'path';
import rimraf from 'rimraf';
import fs from 'fs';
import path from 'path';

const log = (err) => err && console.error(err);

const postBuildStrategy = function (src, dest) {
	const exists = fs.existsSync(src);
	const stats = exists && fs.statSync(src);
	const isDirectory = exists && stats.isDirectory();

	if (isDirectory) {
		fs.mkdirSync(dest);

		for (const child of fs.readdirSync(src)) {
			postBuildStrategy(path.join(src, child),
				path.join(dest, child));
		}
	} else {
		fs.copyFileSync(src, dest);

		if (dest.endsWith('.js')) {
			fs.writeFileSync(
				dest,
				fs.readFileSync(dest)
					.toString()
					.replaceAll(`.json';`, `.json' assert { type: 'json' };`)
			);
		}
	}
};

postBuildStrategy('./build/src', './dist');
rimraf(join(process.cwd(), 'build'), log);