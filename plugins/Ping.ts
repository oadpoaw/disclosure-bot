import Plugin, { PluginMetaData } from '#disclosure/Plugin';

export default class extends Plugin {
	public metadata: PluginMetaData = {
		name: 'Ping',
		description: 'Ping plugin for the ping command',
		author: ['oadpoaw'],
		version: `1.0.0`,
		loadBefore: ['Cooldowns'],
	};

	public override onLoad(): void | Promise<void> {
		this.addCommand(
			(builder) => builder.setName('ping').setDescription('Pong!'),
			(interaction) => interaction.reply('Pong!'),
		);
	}
}
