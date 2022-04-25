import inquirer from 'inquirer';
import yaml from 'yaml';
import { execSync } from 'child_process';
import { existsFile, writeFile } from '@oadpoaw/utils/fs/sync';
import { merge } from '@oadpoaw/utils';
import type { Client } from 'discord.js';

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

	const cfg: Client['config'] = {
		environment: 'development',
		token: '',
		main_guild: '',
		multiguild: false,
		sharding: false,
	};

	if (confirmed) {
		const config = await inquirer.prompt([
			{
				type: 'password',
				message: `Enter Bot Token`,
				name: 'token',
				default: cfg.token,
			},
		]);

		const cf: Client['config'] = merge(cfg, config);
		writeFile(['config.yml'], yaml.stringify(cf));
	} else {
		writeFile(['config.yml'], yaml.stringify(cfg));
	}

	writeFile(
		['config.js'],
		`// @ts-check

/**
 * @type {import('discord.js').ClientOptions}
 */
export const clientOptions = {
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};

/**
 * @type {import('discord.js').ShardingManagerOptions}
 */
export const shardOptions = {
	totalShards: 'auto',
	respawn: true,
};
`,
	);

	execSync('npm run plugins:init');

	console.log('Done!');
})();
