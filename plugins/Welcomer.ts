import { Plugin } from '#disclosure/Plugin';
import { z } from 'zod';

const settings = z.object({
	enabled: z.boolean(),
	message: z.string().nonempty(),
	channel: z.string(),
});

const Welcomer = new Plugin({
	metadata: {
		name: 'Welcomer',
		description: 'Simple Welcome/Farewell messages',
		version: '1.0.2',
		author: ['oadpoaw <github/oadpoaw>'],
	},
	configuration: {
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
	},
});

Welcomer.onLoad = (client) => {
	const config = Welcomer.getConfig('config');

	if (config.welcome.enabled && config.welcome.channel.length) {
		Welcomer.addEvent('guildMemberAdd', async (member) => {
			if (config.welcome.enabled && config.welcome.channel.length) {
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
			}
		});
	}

	if (config.farewell.enabled && config.farewell.channel.length) {
		Welcomer.addEvent('guildMemberRemove', async (member) => {
			if (config.farewell.enabled && config.farewell.channel.length) {
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
			}
		});
	}

	if (config.commands.fakejoin) {
		Welcomer.addCommand(
			{
				name: 'fakejoin',
				description: 'Trigger `guildMemberAdd` event.',
			},
			async (interaction) => {
				if (interaction.inGuild()) {
					const member = await interaction.guild?.members.fetch(
						interaction.user.id,
					);

					if (member) {
						client.emit('guildMemberAdd', member);
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
		Welcomer.addCommand(
			{
				name: 'fakeleave',
				description: 'Trigger `guildMemberRemove` event.',
			},
			async (interaction) => {
				if (interaction.inGuild()) {
					const member = await interaction.guild?.members.fetch(
						interaction.user.id,
					);

					if (member) {
						client.emit('guildMemberRemove', member);
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
};

export default Welcomer;
