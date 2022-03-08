import Command from '../structures/Command';

export const cmd = new Command(
	(builder) => builder.setName('Ping!').setDescription('Replies with pong!'),
	(interaction) => interaction.reply('Pong!'),
	{
		category: '',
	},
);
