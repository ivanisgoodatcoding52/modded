const { Events, PermissionFlagsBits } = require('discord.js');
const { updateServerStats, handleExperience } = require('../data/userData.js');
const autoMod = require('../handlers/autoMod.js');
const { safeReply } = require('../utils/permissions.js');

module.exports = {
    name: Events.MessageCreate,
    execute(message, client) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Update server stats
        updateServerStats(message.guild.id, 'messages');
        
        // Handle XP system if enabled
        if (client.config.levelSystem) {
            handleExperience(message, client);
        }
        
        // Run auto-moderation
        autoMod.checkMessage(message, client);
        
        // Check if message is a command
        if (!message.content.startsWith(client.config.prefix)) return;
        
        // Check if bot can send messages
        if (!message.channel.permissionsFor(message.guild.members.me)?.has(PermissionFlagsBits.SendMessages)) {
            return;
        }
        
        // Parse command
        const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Get command
        const command = client.commands.get(commandName);
        if (!command) return;
        
        // Check permissions
        if (command.data.permissions) {
            const hasModPerms = message.member.permissions.has(PermissionFlagsBits.ModerateMembers) || 
                               message.member.roles.cache.some(role => role.name === client.config.moderatorRole);
            
            if (command.data.permissions.includes('MODERATE_MEMBERS') && !hasModPerms) {
                return safeReply(message, 'You don\'t have permission to use this command.');
            }
        }
        
        // Check cooldowns
        const { cooldowns } = client;
        
        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Map());
        }
        
        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const cooldownAmount = (command.data.cooldown || 3) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return safeReply(message, `Please wait ${timeLeft.toFixed(1)} seconds before using \`${command.data.name}\` again.`);
            }
        }
        
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        // Execute command
        try {
            command.execute(message, args, client);
        } catch (error) {
            console.error(`Error executing command ${command.data.name}:`, error);
            safeReply(message, 'There was an error executing this command!');
        }
    },
};