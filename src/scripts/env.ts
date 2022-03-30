import yaml from 'yaml';
import { existsFile, writeFile } from '../functions/FileSystem.js';
import inquirer from 'inquirer';
import type BotConfig from '../loaders/BotConfig.js';
import { execSync } from 'child_process';

type BotConfiguration = ReturnType<typeof BotConfig>;

(async function env() {
	if (existsFile(['config.yml'])) {
		const { confirmed } = await inquirer.prompt([
			{
				type: 'confirm',
				message:
					'config.yml already exists. Do you still want to continue? (this will override the current config.yml)',
				name: 'confirmed',
				default: true,
			},
		]);

		if (!confirmed) process.exit(1);
	}

	const { confirmed } = await inquirer.prompt([
		{
			type: 'confirm',
			message:
				'Continue setting up? (You can skip and configure later in config.yml)',
			name: 'confirmed',
			default: true,
		},
	]);

	const cfg: BotConfiguration = { token: '' };

	if (confirmed) {
		const config = await inquirer.prompt([
			{
				type: 'password',
				message: `Enter Bot Token`,
				name: 'token',
				default: cfg.token,
			},
		]);

		const cf: BotConfiguration = {
			token: config.token,
		};
		writeFile(['config.yml'], yaml.stringify(cf));
	} else {
		writeFile(['config.yml'], yaml.stringify(cfg));
	}

	writeFile(
		['config.js'],
		`// @ts-check

import { Intents } from 'discord.js';

/**
 * @type {import('discord.js').ClientOptions}
 */
export const clientOptions = {
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};

`,
	);

	execSync('npm run plugins:init');

	console.log('Done!');
})();
