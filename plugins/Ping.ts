import { Plugin } from '#disclosure/Plugin';

export default class Ping extends Plugin {
	public constructor(client: any) {
		super(client, {
			metadata: {
				name: 'Ping',
				description: 'Simple Ping command.',
				version: '1.0.1',
				author: ['oadpoaw <github/oadpoaw>'],
			},
			configuration: {},
		});
	}

	public onLoad() {
		this.addCommand(
			(builder) =>
				builder.setName('ping').setDescription('Simple Ping Command.'),
			(interaction) => {
				interaction.reply(`Pong!`);
			},
			{},
		);
	}
}
