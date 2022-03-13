import yaml from 'yaml';
import { readFile } from '../functions/FileSystem.js';

interface Config {
	environment: 'development' | 'production';
	autoUpdates: boolean;
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
	const buffer = readFile(['config.yml']);
	config = yaml.parse(buffer.toString());
	return config;
}
