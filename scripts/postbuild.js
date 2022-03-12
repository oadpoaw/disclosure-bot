const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const log = (err) => err && console.error(err);

function fixNodeFetch() {
	const filePath = path.join(process.cwd(), 'dist', 'src', 'utils', 'node-fetch.js');
	const file = fs.readFileSync(filePath);
	fs.writeFileSync(
		filePath,
		file.toString()
			.replace(`__importStar(require('node-fetch'))`, `import('node-fetch')`)
	);
}

function fixSemverPackage() {
	const filePath = path.join(process.cwd(), 'dist', 'src', 'functions', 'plugin', 'PluginVerifiers.js');
	const file = fs.readFileSync(filePath);
	fs.writeFileSync(
		filePath,
		file.toString()
			.replace(`tslib_1.__importStar(require('semver-regex'))`, `import('semver-regex')`)
	);
}

fixNodeFetch();
fixSemverPackage();
rimraf(path.join(process.cwd(), 'dist', 'plugins'), log);
rimraf(path.join(process.cwd(), 'dist', 'tsconfig.tsbuildinfo'), log);