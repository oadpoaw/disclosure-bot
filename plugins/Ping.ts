import Plugin, { PluginMetaData } from '@disclosure/Plugin';

export default class Ping extends Plugin {
	public readonly metadata: PluginMetaData = {
		name: 'Ping',
		description: 'Simple Plugin for Ping command',
		version: '1.0.0',
		author: 'oadpoaw',
	};

	public onLoad() {
		this.addEvent('messageCreate', (_, message) => {
			if (!message.author.bot && message.content.startsWith('?ping'))
				message.channel.send('Pong!');
		});

		this.addCommand(
			(builder) => builder.setName('ping').setDescription('Pong!'),
			(interaction) => interaction.reply('Pong!'),
		);
	}
}
