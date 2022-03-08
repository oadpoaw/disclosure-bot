import Plugin from '@structures/Plugin';

export default class Ping extends Plugin {
	public constructor(client: any) {
		super(client, {
			name: 'Ping',
			description: 'Simple Ping Plugin',
			version: '1.0.0',
			author: 'oadpoaw',
			dependencies: [],
		});
	}

	public getDefaultConfig() {
		return {
			test: 'dasdasd',
		};
	}
}
