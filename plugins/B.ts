import Plugin, { PluginMetaData } from '@disclosure/Plugin';

export default class B extends Plugin {
	public metadata: PluginMetaData = {
		name: 'B',
		description: 'Plugin B',
		author: ['B'],
		version: `1.23.5`,
	};
	public onLoad(): void | Promise<void> {
		this.client.logger.info(`${this.metadata.name} has been loaded`);

		this.addCommand(
			(builder) => builder.setName('ping').setDescription('Pong!'),
			(interaction) => interaction.reply('Pong!'),
		);

		this.addInhibitor((_interaction, _command) => {
			this.client.logger.info(
				`This inhibitor is from ${this.metadata.name}`,
			);
			return true;
		});
	}
}
