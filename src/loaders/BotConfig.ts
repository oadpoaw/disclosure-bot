import yaml from 'yaml';
import { readFile } from '../utils/FileSystem';

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
	const buffer = readFile('config.yml');
	config = yaml.parse(buffer.toString());
	return config;
}
