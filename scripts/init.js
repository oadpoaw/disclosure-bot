import { symlinkSync, writeFileSync } from "fs";
import { join } from "path";

const json = {
	"$schema": "http://json.schemastore.org/package",
	"private": true,
	"type": "module",
	"dependencies": {},
	"devDependencies": {},
	"imports": {
		"#disclosure/*": "./dist/structures/*.js"
	}
};

writeFileSync(join(process.cwd(), 'plugins', 'package.json'), JSON.stringify(json, null, 4));
symlinkSync(join(process.cwd(), 'dist'), join(process.cwd(), 'plugins', 'dist'));
