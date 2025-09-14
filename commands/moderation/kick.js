const { PermissionFlagsBits } = require('discord.js');
const { safeReply } = require('../../utils/permissions.js');
const { logAction } = require('../../utils/logger.js');
const { updateServerStats } = require('../../data/storage.js');

module.exports = {
    data: {
        name: 'kick',
        description: 'Kick a user from the server',
        usage: '!kick @user [reason]',
        permissions: ['MODERATE_MEMBERS'],
        cooldown: 3
    },
    
    async execute(message, args, client) {
        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        if (!user) {
            return safeReply(message, 'Please mention a user or provide a valid user ID.');
        }
        
        if (user.id === message.author.id) {
            return safeReply(message, 'You cannot kick yourself.');
        }
        
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return safeReply(message, 'User is not in this server.');
        }
        
        // Check role hierarchy
        if (member.roles.highest.position >= message.member.roles.highest.position && 
            message.guild.ownerId !== message.author.id) {
            return safeReply(message, 'You cannot kick someone with an equal or higher role.');
        }
        
        if (!member.kickable) {
            return safeReply(message, 'I cannot kick this user. They may have a higher role than me or be the server owner.');
        }
        
        try {
            // Send DM before kicking
            try {
                await user.send(
                    `You have been kicked from **${message.guild.name}**\n` +
                    `Reason: ${reason}\n` +
                    `Kicked by: ${message.author.tag}`
                );
            } catch (dmError) {
                // User has DMs disabled
            }
            
            await member.kick(reason);
            
            // Update stats
            updateServerStats(message.guild.id, 'kicks');
            safeReply(message, `**${user.tag}** has been kicked. Reason: ${reason}`);
            logAction(message.guild, 'Kick', user, message.author, reason, client);
            
        } catch (error) {
            console.error('Kick error:', error);
            safeReply(message, `Failed to kick the user. Error: ${error.message}`);
        }
    },
};