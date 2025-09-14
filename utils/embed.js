const { EmbedBuilder } = require('discord.js');

/**
 * Create a success embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Client} client - Discord client for colors
 * @returns {EmbedBuilder} - Success embed
 */
function createSuccessEmbed(title, description, client) {
    return new EmbedBuilder()
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setColor(client?.config?.colors?.success || '#2ecc71')
        .setTimestamp();
}

/**
 * Create an error embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Client} client - Discord client for colors
 * @returns {EmbedBuilder} - Error embed
 */
function createErrorEmbed(title, description, client) {
    return new EmbedBuilder()
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setColor(client?.config?.colors?.error || '#e74c3c')
        .setTimestamp();
}

/**
 * Create a warning embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Client} client - Discord client for colors
 * @returns {EmbedBuilder} - Warning embed
 */
function createWarningEmbed(title, description, client) {
    return new EmbedBuilder()
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setColor(client?.config?.colors?.warning || '#f39c12')
        .setTimestamp();
}

/**
 * Create an info embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Client} client - Discord client for colors
 * @returns {EmbedBuilder} - Info embed
 */
function createInfoEmbed(title, description, client) {
    return new EmbedBuilder()
        .setTitle(`📘 ${title}`)
        .setDescription(description)
        .setColor(client?.config?.colors?.info || '#3498db')
        .setTimestamp();
}

/**
 * Create a moderation log embed
 * @param {string} action - Moderation action
 * @param {User} target - Target user
 * @param {User} moderator - Moderator
 * @param {string} reason - Reason for action
 * @param {Client} client - Discord client
 * @returns {EmbedBuilder} - Moderation embed
 */
function createModerationEmbed(action, target, moderator, reason, client) {
    const embed = new EmbedBuilder()
        .setTitle(`🛡️ ${action}`)
        .setColor(client?.config?.colors?.moderation || '#e74c3c')
        .addFields(
            { 
                name: '👤 Target', 
                value: target ? `${target.tag} (${target.id})` : 'N/A', 
                inline: true 
            },
            { 
                name: '🔨 Moderator', 
                value: `${moderator.tag} (${moderator.id})`, 
                inline: true 
            },
            { 
                name: '📝 Reason', 
                value: reason || 'No reason provided', 
                inline: false 
            }
        )
        .setTimestamp();
    
    if (target) {
        embed.setThumbnail(target.displayAvatarURL());
    }
    
    return embed;
}

/**
 * Create a user info embed
 * @param {User} user - Discord user
 * @param {GuildMember} member - Guild member (optional)
 * @param {Object} userData - User data from database (optional)
 * @param {Client} client - Discord client
 * @returns {EmbedBuilder} - User info embed
 */
function createUserInfoEmbed(user, member, userData, client) {
    const embed = new EmbedBuilder()
        .setTitle(`👤 ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .setColor(client?.config?.colors?.info || '#3498db')
        .addFields(
            { name: '🆔 User ID', value: user.id, inline: true },
            { name: '📅 Created', value: user.createdAt.toLocaleDateString(), inline: true },
            { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true }
        );
    
    if (member) {
        embed.addFields(
            { name: '📅 Joined', value: member.joinedAt?.toLocaleDateString() || 'Unknown', inline: true },
            { name: '🎭 Nickname', value: member.nickname || 'None', inline: true },
            { name: '🎨 Roles', value: member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.name).join(', ') || 'None', inline: false }
        );
    }
    
    if (userData) {
        embed.addFields(
            { name: '🏆 Level', value: userData.level?.toString() || '1', inline: true },
            { name: '✨ XP', value: userData.xp?.toString() || '0', inline: true },
            { name: '⚠️ Warnings', value: userData.warnings?.length?.toString() || '0', inline: true }
        );
    }
    
    return embed.setTimestamp();
}

/**
 * Create a help embed for a command category
 * @param {string} category - Command category
 * @param {Array} commands - Array of commands
 * @param {Client} client - Discord client
 * @returns {EmbedBuilder} - Help embed
 */
function createHelpEmbed(category, commands, client) {
    const embed = new EmbedBuilder()
        .setTitle(`📚 ${category} Commands`)
        .setColor(client?.config?.colors?.info || '#3498db')
        .setTimestamp();
    
    if (commands && commands.length > 0) {
        commands.forEach(cmd => {
            embed.addFields({
                name: cmd.usage || `!${cmd.name}`,
                value: cmd.description || 'No description',
                inline: false
            });
        });
    }
    
    return embed;
}

/**
 * Truncate text to fit in embed field
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default 1024)
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 1024) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Create a loading embed
 * @param {string} message - Loading message
 * @param {Client} client - Discord client
 * @returns {EmbedBuilder} - Loading embed
 */
function createLoadingEmbed(message, client) {
    return new EmbedBuilder()
        .setTitle('Loading...')
        .setDescription(message || 'Please wait...')
        .setColor(client?.config?.colors?.info || '#3498db')
        .setTimestamp();
}

module.exports = {
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed,
    createInfoEmbed,
    createModerationEmbed,
    createUserInfoEmbed,
    createHelpEmbed,
    createLoadingEmbed,
    truncateText
};