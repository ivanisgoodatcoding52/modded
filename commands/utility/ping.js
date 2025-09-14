const { EmbedBuilder } = require('discord.js');
const { safeReply } = require('../../utils/permissions.js');

module.exports = {
    data: {
        name: 'ping',
        description: 'Check bot latency and API ping',
        usage: '!ping',
        aliases: ['latency', 'pong'],
        cooldown: 5
    },
    
    async execute(message, args, client) {
        const start = Date.now();
        const reply = await safeReply(message, 'Pinging...');
        const end = Date.now();
        
        const embed = new EmbedBuilder()
            .setTitle('recieved')
            .setColor(client.config.colors.info)
            .addFields(
                { name: 'Bot Latency', value: `${end - start}ms`, inline: true },
                { name: 'API Latency', value: `${client.ws.ping}ms`, inline: true },
                { name: 'Status', value: getStatusFromPing(client.ws.ping), inline: true }
            )
            .setTimestamp();
        
        reply.edit({ content: '', embeds: [embed] });
    },
};

function getStatusFromPing(ping) {
    if (ping < 100) return 'Excellent';
    if (ping < 200) return 'Good';
    if (ping < 300) return 'Fair';
    return 'Poor';
}