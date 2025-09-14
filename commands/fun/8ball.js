const { EmbedBuilder } = require('discord.js');
const { safeReply } = require('../../utils/permissions.js');

module.exports = {
    data: {
        name: '8ball',
        description: 'Ask the magic 8-ball a question',
        usage: '!8ball <question>',
        aliases: ['eightball', 'magic8ball'],
        category: 'fun',
        cooldown: 3
    },
    
    async execute(message, args, client) {
        if (args.length === 0) {
            return safeReply(message, 'Please ask a question!\nExample: `!8ball Will it rain today?`');
        }
        
        const question = args.join(' ');
        const responses = client.config.eightBallResponses;
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        const embed = new EmbedBuilder()
            .setTitle('8-Ball')
            .setColor(client.config.colors.fun)
            .addFields(
                { 
                    name: 'Question', 
                    value: question.length > 100 ? question.substring(0, 100) + '...' : question, 
                    inline: false 
                },
                { 
                    name: 'Answer', 
                    value: response, 
                    inline: false 
                }
            )
            .setFooter({ text: `Asked by ${message.author.tag}` })
            .setTimestamp();
        
        safeReply(message, { embeds: [embed] });
    },
};