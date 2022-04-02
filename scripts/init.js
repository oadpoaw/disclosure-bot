import { symlinkSync } from "fs";
import { join } from "path";
import { writeFile } from '@oadpoaw/utils/fs/sync';

const stringify = (json) => JSON.stringify(json, null, 4);

const packageJson = {
	"$schema": "http://json.schemastore.org/package",
	"private": true,
	"type": "module",
	"dependencies": {},
	"imports": {
		"#disclosure/*": "./dist/public/*.js"
	}
};

const tsConfigJson = {
	"$schema": "https://json.schemastore.org/tsconfig",
	"compilerOptions": {
		"declaration": false,
		"declarationMap": false,
		"outDir": "plugins",
		"sourceMap": false,
		"baseUrl": "./dist",
		"paths": {
			"#disclosure/*": [
				"public/*"
			]
		}
	},
	"exclude": [],
	"extends": "@oadpoaw/ts-config",
	"include": [
		"."
	]
};

writeFile(['plugins', 'package.json'], stringify(packageJson));
writeFile(['plugins', 'tsconfig.json'], stringify(tsConfigJson));

symlinkSync(join(process.cwd(), 'dist'), join(process.cwd(), 'plugins', 'dist'));
