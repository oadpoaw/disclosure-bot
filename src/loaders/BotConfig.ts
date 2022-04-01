import yaml from 'yaml';
import z from 'zod';
import { readFile } from '@oadpoaw/utils/fs/sync';

const Validator = z.object({
	token: z.string().nonempty(),
});

export type Config = z.infer<typeof Validator>;

let config: Config;

export default function BotConfig(): Config {
	if (config) return config;

	const buffer = readFile(['config.yml']);
	config = yaml.parse(buffer.toString());

	Validator.parse(config);

	return config;
}
