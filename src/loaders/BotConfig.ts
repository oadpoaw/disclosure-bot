import yaml from 'yaml';
import fs from 'fs';
import path from 'path';

interface Config {
	token: string;
	guild: string;
	autoUpdates: boolean;
	owner: string | string[];
}

let config: Config;

export default function BotConfig(): Config {
	if (config) return config;

	const buffer = fs.readFileSync(path.join(process.cwd(), 'config.yml'));

	config = yaml.parse(buffer.toString());

	return config;
}
