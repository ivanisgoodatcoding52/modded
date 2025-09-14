const { PermissionFlagsBits } = require('discord.js');

/**
 * Safe reply function that checks permissions before sending
 * @param {Message} message - Discord message object
 * @param {string|Object} content - Content to send
 * @param {Object} options - Additional options
 * @returns {Promise<Message|null>} - Sent message or null
 */
async function safeReply(message, content, options = {}) {
    try {
        // Check if message still exists and channel permissions
        if (!message.channel || !message.guild) {
            console.log('Message or channel no longer exists');
            return null;
        }
        
        const botMember = message.guild.members.me;
        if (!botMember) {
            console.log('Bot member not found in guild');
            return null;
        }
        
        const channelPerms = message.channel.permissionsFor(botMember);
        if (!channelPerms?.has(PermissionFlagsBits.SendMessages)) {
            console.log(`Cannot reply in channel ${message.channel.name}: Missing Send Messages permission`);
            return null;
        }
        
        // Try to reply first, fallback to regular send if reply fails
        try {
            return await message.reply(content, options);
        } catch (replyError) {
            // If reply fails (message might be deleted), try regular send
            if (replyError.code === 10008 || replyError.message?.includes('Unknown message')) {
                console.log('Original message deleted, sending regular message instead');
                return await message.channel.send(content, options);
            }
            throw replyError;
        }
    } catch (error) {
        console.error('Failed to send reply:', error.message);
        return null;
    }
}

/**
 * Safe send function that checks permissions before sending
 * @param {Channel} channel - Discord channel object
 * @param {string|Object} content - Content to send
 * @param {Object} options - Additional options
 * @returns {Promise<Message|null>} - Sent message or null
 */
async function safeSend(channel, content, options = {}) {
    try {
        if (!channel || !channel.guild) {
            console.log('Channel or guild no longer exists');
            return null;
        }
        
        const botMember = channel.guild.members.me;
        if (!botMember) {
            console.log('Bot member not found in guild');
            return null;
        }
        
        const channelPerms = channel.permissionsFor(botMember);
        if (!channelPerms?.has(PermissionFlagsBits.SendMessages)) {
            console.log(`Cannot send in channel ${channel.name}: Missing Send Messages permission`);
            return null;
        }
        
        return await channel.send(content, options);
    } catch (error) {
        console.error('Failed to send message:', error.message);
        return null;
    }
}

/**
 * Check if user has moderator permissions
 * @param {GuildMember} member - Guild member to check
 * @param {string} moderatorRole - Name of moderator role
 * @returns {boolean} - True if user has mod permissions
 */
function hasModPerms(member, moderatorRole) {
    if (!member || !member.permissions) return false;
    
    return member.permissions.has(PermissionFlagsBits.ModerateMembers) || 
           member.roles.cache.some(role => role.name === moderatorRole);
}

/**
 * Check if target can be moderated by moderator
 * @param {GuildMember} moderator - Member performing action
 * @param {GuildMember} target - Member being moderated
 * @param {string} guildOwnerId - Guild owner ID
 * @returns {boolean} - True if target can be moderated
 */
function canModerate(moderator, target, guildOwnerId) {
    if (!moderator || !target) return false;
    
    // Owner can moderate anyone
    if (moderator.id === guildOwnerId) return true;
    
    // Cannot moderate someone with higher or equal role
    if (target.roles.highest.position >= moderator.roles.highest.position) return false;
    
    return true;
}

/**
 * Check if bot has required permissions in a channel
 * @param {Channel} channel - Discord channel
 * @param {Array<string>} permissions - Array of permission names
 * @returns {Object} - Object with missing permissions
 */
function checkBotPermissions(channel, permissions) {
    if (!channel || !channel.guild) {
        return { hasAll: false, missing: permissions };
    }
    
    const botMember = channel.guild.members.me;
    if (!botMember) {
        return { hasAll: false, missing: permissions };
    }
    
    const channelPerms = channel.permissionsFor(botMember);
    const missing = [];
    
    for (const permission of permissions) {
        if (!channelPerms?.has(PermissionFlagsBits[permission])) {
            missing.push(permission);
        }
    }
    
    return {
        hasAll: missing.length === 0,
        missing: missing
    };
}

module.exports = {
    safeReply,
    safeSend,
    hasModPerms,
    canModerate,
    checkBotPermissions
};