import { writeFileSync } from "fs";
import { join } from "path";

const json = {
	"$schema": "http://json.schemastore.org/package",
	"private": true,
	"type": "module",
	"dependencies": {},
	"devDependencies": {}
};

writeFileSync(join(process.cwd(), 'plugins', 'package.json'), JSON.stringify(json, null, 4));
