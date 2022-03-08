import Command from '@structures/Command';

export const command = new Command(
	(builder) => builder.setName('ping').setDescription('Pong!'),
	(interaction) => interaction.reply('Pong!'),
	{},
);
