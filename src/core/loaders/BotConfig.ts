import yaml from 'yaml';
import fs from 'fs/promises';
import path from 'path/posix';

interface Config {
	token: string;
	guild: string;
	autoUpdates: boolean;
	owner: string | string[];
}

let config: Config;

export default async function BotConfig(): Promise<Config> {
	if (config) return config;

	const buffer = await fs.readFile(path.join(process.cwd(), 'config.yml'));

	config = yaml.parse(buffer.toString());

	return config;
}
