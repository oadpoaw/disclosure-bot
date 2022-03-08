import { ClientOptions, Intents } from 'discord.js';

export const clientOptions: ClientOptions = {
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};
