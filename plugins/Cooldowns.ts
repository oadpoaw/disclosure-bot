import Plugin, { PluginMetaData, PlaceHolder } from '#disclosure/Plugin';
import ms from 'ms';

export default class Cooldowns extends Plugin {
	public metadata: PluginMetaData = {
		name: 'Cooldowns',
		description: 'Adds slash command cooldowns to your bot',
		version: '1.0.0',
		author: 'oadpoaw',
		npmDependencies: ['@sapphire/ratelimits'],
	};

	private holds!: Map<
		string,
		import('@sapphire/ratelimits').RateLimitManager
	>;

	public override getDefaultConfig() {
		return {
			message_cooldown:
				'Hey, slow down. please wait %cooldown% to run that command again',
			default_cooldown: 3,
			commands: [
				{
					name: 'ping',
					cooldown: 10,
					points: 1,
				},
			],
		};
	}

	public async onLoad(): Promise<void> {
		this.holds = new Map();

		await this.reconfigure();
		const { RateLimitManager } = await import('@sapphire/ratelimits');

		this.addInhibitor(async (interaction, command) => {
			let manager = this.holds.get(command.name);

			if (!manager) {
				manager = new RateLimitManager(
					this.getConfig().default_cooldown * 1000,
					1,
				);
				this.holds.set(command.name, manager);
			}

			const consumer = manager.acquire(interaction.user.id);

			if (consumer.limited) {
				await interaction.reply({
					content: PlaceHolder(
						this.getConfig().message_cooldown,
						'cooldown',
						ms(consumer.remainingTime),
					),
					ephemeral: true,
				});

				return false;
			}

			consumer.consume();

			return true;
		});
	}

	public async onReload(): Promise<void> {
		await this.reconfigure();
	}

	public async reconfigure() {
		const defaultConfig = this.getDefaultConfig() as ReturnType<
			Cooldowns['getDefaultConfig']
		>;
		const config = this.getConfig() as ReturnType<
			Cooldowns['getDefaultConfig']
		>;

		if (typeof config !== 'object') {
			this.setConfig(defaultConfig);
		} else {
			if (typeof config.message_cooldown !== 'string') {
				config.message_cooldown = config.message_cooldown;
			}

			if (
				typeof config.default_cooldown !== 'number' ||
				config.default_cooldown < 0
			) {
				config.default_cooldown = defaultConfig.default_cooldown;
			}

			if (!Array.isArray(config.commands)) {
				config.commands = defaultConfig.commands;
			} else {
				config.commands = config.commands
					.map((x) => {
						if (
							typeof x === 'object' &&
							typeof x.name === 'string' &&
							x.name.length &&
							typeof x.cooldown === 'number' &&
							x.cooldown >= 0 &&
							typeof x.points === 'number' &&
							x.points > 0
						) {
							x.name = x.name.toLowerCase();
							return x;
						}

						return false;
					})
					.filter((x) => x) as typeof config.commands;
			}

			this.setConfig(config);
		}

		const { RateLimitManager } = await import('@sapphire/ratelimits');

		for (const point of config.commands) {
			this.holds.set(
				point.name,
				new RateLimitManager(point.cooldown * 1000, point.points),
			);
		}
	}
}
