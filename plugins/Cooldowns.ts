import Plugin, {
	PluginMetaData,
	PlaceHolder,
	InferConfiguration,
} from '#disclosure/Plugin';
import ms from 'ms';
import z from 'zod';

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
			config: {
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
			},
			validation: z.object({
				message_cooldown: z.string().nonempty(),
				default_cooldown: z.number().nonnegative(),
				commands: z
					.object({
						name: z.string().nonempty(),
						cooldown: z.number().nonnegative(),
						points: z.number().nonnegative(),
					})
					.array(),
			}),
		};
	}

	public async onLoad(): Promise<void> {
		this.holds = new Map();

		const { RateLimitManager } = await import('@sapphire/ratelimits');

		this.addInhibitor(async (interaction, command) => {
			let manager = this.holds.get(command.name);

			if (!manager) {
				const config =
					this.getConfig() as InferConfiguration<Cooldowns>;

				manager = new RateLimitManager(
					config.default_cooldown * 1000,
					1,
				);
				this.holds.set(command.name, manager);
			}

			const consumer = manager.acquire(interaction.user.id);

			if (consumer.limited) {
				const config =
					this.getConfig() as InferConfiguration<Cooldowns>;

				await interaction.reply({
					content: PlaceHolder(
						config.message_cooldown,
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
}
