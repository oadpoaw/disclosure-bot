import { Plugin } from '#disclosure/Plugin';
import { z } from 'zod';

const settings = z.object({
	enabled: z.boolean(),
	message: z.string().min(6),
	channel: z.string(),
});

const configuration = {
	config: {
		config: {
			welcome: {
				enabled: true,
				message: '%user% has joined the server',
				channel: '958901656186159106',
			},
			farewell: {
				enabled: true,
				message: '%user% has left the server',
				channel: '958901656186159106',
			},
			commands: {
				fakejoin: true,
				fakeleave: true,
			},
		},
		validation: z.object({
			welcome: settings,
			farewell: settings,
			commands: z.object({
				fakejoin: z.boolean(),
				fakeleave: z.boolean(),
			}),
		}),
	},
};

export default class Welcomer extends Plugin<typeof configuration> {
	public constructor(client: any) {
		super(client, {
			metadata: {
				name: 'Welcomer',
				description: 'Simple Welcome/Farewell messages',
				version: '1.0.0',
				author: ['oadpoaw <github/oadpoaw>'],
			},
			configuration,
		});
	}

	public onLoad() {
		const config = this.getConfig('config');
		if (config.welcome.enabled && config.welcome.channel.length) {
			this.addEvent('guildMemberAdd', async (member) => {
				const channel = await member.guild.channels
					.fetch(config.welcome.channel)
					.catch(() => {});

				if (channel && channel.isText()) {
					await channel.send(
						config.welcome.message.replaceAll(
							'%user%',
							member.user.toString(),
						),
					);
				}
			});
		}

		if (config.farewell.enabled && config.farewell.channel.length) {
			this.addEvent('guildMemberRemove', async (member) => {
				const channel = await member.guild.channels
					.fetch(config.farewell.channel)
					.catch(() => {});

				if (channel && channel.isText()) {
					await channel.send(
						config.farewell.message.replaceAll(
							'%user%',
							member.user.toString(),
						),
					);
				}
			});
		}

		if (config.commands.fakejoin) {
			this.addCommand(
				(builder) =>
					builder
						.setName('fakejoin')
						.setDescription('Triggers `guildMemberAdd` event.'),
				async (interaction) => {
					if (interaction.inGuild()) {
						const member = await interaction.guild?.members.fetch(
							interaction.user.id,
						);

						if (member) {
							this.client.emit('guildMemberAdd', member);
						}

						await interaction.reply({
							content: 'Done!',
							ephemeral: true,
						});
					} else {
						await interaction.reply({
							content:
								'This command can only be executed within a guild/server.',
							ephemeral: true,
						});
					}
				},
			);
		}

		if (config.commands.fakeleave) {
			this.addCommand(
				(builder) =>
					builder
						.setName('fakeleave')
						.setDescription('Triggers `guildMemberRemove` event.'),
				async (interaction) => {
					if (interaction.inGuild()) {
						const member = await interaction.guild?.members.fetch(
							interaction.user.id,
						);

						if (member) {
							this.client.emit('guildMemberRemove', member);
						}

						await interaction.reply({
							content: 'Done!',
							ephemeral: true,
						});
					} else {
						await interaction.reply({
							content:
								'This command can only be executed within a guild/server.',
							ephemeral: true,
						});
					}
				},
			);
		}
	}
}
