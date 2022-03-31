import { Plugin } from '#disclosure/Plugin';

const Ping = new Plugin({
	metadata: {
		name: 'Ping',
		description: 'Simple Ping command.',
		version: '1.0.1',
		author: ['oadpoaw <github/oadpoaw>'],
	},
	configuration: {},
});

Ping.on('load', () => {
	Ping.addCommand(
		{
			name: 'ping',
			description: 'Simple Ping command.',
		},
		(interaction) => {
			interaction.reply(`Pong!`);
		},
	);
});

export default Ping;
