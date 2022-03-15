import yaml from 'yaml';
import z from 'zod';
import { readFile } from '../functions/FileSystem.js';

const Validator = z.object({
	environment: z.enum(['development', 'production']),
	bot: z.object({
		token: z.string().nonempty(),
		guild: z.string().nonempty(),
		sharding: z.boolean(),
	}),
});

type Config = z.infer<typeof Validator>;

let config: Config;

export default function BotConfig(): Config {
	if (config) return config;
	const buffer = readFile(['config.yml']);
	config = yaml.parse(buffer.toString());
	Validator.parse(config);
	return config;
}
