import DiscordEvent from '../structures/DiscordEvent';

const event = new DiscordEvent('ready', undefined, (client) => {
	client.logger.info('Bot Ready!');
});

export default event;
