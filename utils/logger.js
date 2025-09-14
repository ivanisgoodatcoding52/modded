const { EmbedBuilder } = require('discord.js');
const { safeSend } = require('./permissions.js');

/**
 * Log moderation action to the log channel
 * @param {Guild} guild - Discord guild
 * @param {string} action - Action taken
 * @param {User} target - Target user
 * @param {User} moderator - Moderator user
 * @param {string} reason - Reason for action
 * @param {Client} client - Discord client
 */
async function logAction(guild, action, target, moderator, reason, client) {
    const logChannel = guild.channels.cache.find(channel => 
        channel.name === client.config.logChannelName
    );
    
    if (!logChannel) return;
    
    const embed = new EmbedBuilder()
        .setTitle(`${action}`)
        .setColor(client.config.colors.moderation)
        .addFields(
            { 
                name: 'Target', 
                value: target ? `${target.tag} (${target.id})` : 'N/A', 
                inline: true 
            },
            { 
                name: 'Moderator', 
                value: `${moderator.tag} (${moderator.id})`, 
                inline: true 
            },
            { 
                name: 'Reason', 
                value: reason, 
                inline: false 
            }
        )
        .setTimestamp();
    
    if (target) {
        embed.setThumbnail(target.displayAvatarURL());
    }
    
    await safeSend(logChannel, { embeds: [embed] });
}

/**
 * Log auto-moderation action
 * @param {Guild} guild - Discord guild
 * @param {string} action - Action taken
 * @param {User} user - Target user
 * @param {string} actionTaken - Description of action
 * @param {string} reason - Reason for action
 * @param {Client} client - Discord client
 */
async function logAutoModAction(guild, action, user, actionTaken, reason, client) {
    const logChannel = guild.channels.cache.find(channel => 
        channel.name === client.config.logChannelName
    );
    
    if (!logChannel) return;
    
    const embed = new EmbedBuilder()
        .setTitle(`Auto-Mod: ${action}`)
        .setColor(client.config.colors.automod)
        .addFields(
            { 
                name: 'User', 
                value: `${user.tag} (${user.id})`, 
                inline: true 
            },
            { 
                name: 'Action Taken', 
                value: actionTaken, 
                inline: true 
            },
            { 
                name: 'Reason', 
                value: reason, 
                inline: false 
            }
        )
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();
    
    await safeSend(logChannel, { embeds: [embed] });
}

/**
 * Log general server event
 * @param {Guild} guild - Discord guild
 * @param {string} event - Event type
 * @param {string} description - Event description
 * @param {string} color - Embed color
 * @param {Client} client - Discord client
 */
async function logEvent(guild, event, description, color, client) {
    const logChannel = guild.channels.cache.find(channel => 
        channel.name === client.config.logChannelName
    );
    
    if (!logChannel) return;
    
    const embed = new EmbedBuilder()
        .setTitle(`${event}`)
        .setDescription(description)
        .setColor(color || client.config.colors.info)
        .setTimestamp();
    
    await safeSend(logChannel, { embeds: [embed] });
}

/**
 * Console log with timestamp and color
 * @param {string} message - Message to log
 * @param {string} type - Log type (info, warn, error, success)
 */
function consoleLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        info: '\x1b[36m',    // Cyan
        warn: '\x1b[33m',    // Yellow
        error: '\x1b[31m',   // Red
        success: '\x1b[32m', // Green
        reset: '\x1b[0m'     // Reset
    };
    
    const color = colors[type] || colors.info;
    const prefix = {
        info: '📘',
        warn: '⚠️',
        error: '❌',
        success: '✅'
    }[type] || '📘';
    
    console.log(`${color}[${timestamp}] ${prefix} ${message}${colors.reset}`);
}

module.exports = {
    logAction,
    logAutoModAction,
    logEvent,
    consoleLog
};