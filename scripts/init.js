import { symlinkSync, writeFileSync } from "fs";
import { join } from "path";

writeFileSync(join(process.cwd(), 'plugins', 'package.json'), JSON.stringify({
	"$schema": "http://json.schemastore.org/package",
	"private": true,
	"type": "module",
	"dependencies": {},
	"imports": {
		"#disclosure/*": "./dist/public/*.js"
	}
}, null, 4));

writeFileSync(join(process.cwd(), 'plugins', 'tsconfig.json'), JSON.stringify({
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
}, null, 4));

symlinkSync(join(process.cwd(), 'dist'), join(process.cwd(), 'plugins', 'dist'));
