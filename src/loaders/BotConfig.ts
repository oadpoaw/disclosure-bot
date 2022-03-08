import yaml from 'yaml';
import fs from 'fs';
import path from 'path';

interface Config {
	environment: 'development' | 'production';
	autoUpdates: false;
	bot: {
		token: string;
		guild: string;
		sharding: boolean;
		owner: string | string[];
	};
}

let config: Config;

export default function BotConfig(): Config {
	if (config) return config;
	const buffer = fs.readFileSync(path.join(process.cwd(), 'config.yml'));
	config = yaml.parse(buffer.toString());
	return config;
}
