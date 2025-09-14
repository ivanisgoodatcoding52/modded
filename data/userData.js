const { getUserData, updateUserData, updateServerStats } = require('./storage.js');
const { safeReply } = require('../utils/permissions.js');
const { EmbedBuilder } = require('discord.js');
/**
 * this is a copy of that level up thing that many discord servers use
 */



/**
 * Handle experience gain and level up
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 */
async function handleExperience(message, client) {
    const userId = message.author.id;
    const userData = getUserData(userId);
    
    // Prevent spam XP farming (1 XP per 10 seconds max)
    const now = Date.now();
    if (now - userData.lastMessage < 10000) return;
    
    // Calculate XP gain (15-25 XP per message)
    const xpGain = Math.floor(Math.random() * 11) + 15;
    const newXP = userData.xp + xpGain;
    const newMessages = userData.messages + 1;
    
    // Calculate new level
    const newLevel = Math.floor(0.1 * Math.sqrt(newXP));
    const oldLevel = userData.level;
    
    // Update user data
    updateUserData(userId, {
        xp: newXP,
        level: newLevel,
        messages: newMessages,
        lastMessage: now
    });
    
    // Check for level up
    if (newLevel > oldLevel) {
        await handleLevelUp(message, client, newLevel, oldLevel);
    }
}

/**
 * Handle level up notification and rewards
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 * @param {number} newLevel - New level
 * @param {number} oldLevel - Previous level
 */
async function handleLevelUp(message, client, newLevel, oldLevel) {
    const embed = new EmbedBuilder()
        .setTitle('Level Up!')
        .setDescription(
            `${message.author} reached level **${newLevel}**!\n` +
        )
        .setColor(client.config.colors.level)
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
            { name: 'Previous Level', value: oldLevel.toString(), inline: true },
            { name: 'New Level', value: newLevel.toString(), inline: true },
            { name: 'Next Level', value: `Level ${newLevel + 1}`, inline: true }
        )
        .setTimestamp();
    
    // Add special messages for milestone levels
    if (newLevel % 10 === 0) {
        embed.setDescription(
            `**MILESTONE!** ${message.author} reached level **${newLevel}**! 🌟\n` +
            `This is a special achievement! Keep up the great work! 🎊`
        );
        embed.setColor('#FFD700'); // Gold color for milestones
    }
    
    const levelUpMsg = await safeReply(message, { embeds: [embed] });
    
    // Add reactions for celebration
    if (levelUpMsg) {
        try {
            await levelUpMsg.react('🎉');
            await levelUpMsg.react('👏');
            await levelUpMsg.react('🚀');
        } catch (error) {
            // Ignore reaction errors
        }
    }
    
    // Award milestone rewards
    await checkLevelRewards(message, client, newLevel);
}

/**
 * Check and award level rewards
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 * @param {number} level - User level
 */
async function checkLevelRewards(message, client, level) {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member) return;
    
    // Level-based role rewards (customize these for your server)
    const levelRoles = {
        5: 'Active Member',
        10: 'Regular',
        25: 'Veteran',
        50: 'Elite',
        100: 'Legend'
    };
    
    const rewardRole = levelRoles[level];
    if (rewardRole) {
        const role = message.guild.roles.cache.find(r => r.name === rewardRole);
        if (role && !member.roles.cache.has(role.id)) {
            try {
                await member.roles.add(role);
                
                const rewardEmbed = new EmbedBuilder()
                    .setTitle('Level Reward!')
                    .setDescription(`${message.author} earned the **${rewardRole}** role!`)
                    .setColor('#FF6B6B')
                    .setThumbnail(message.author.displayAvatarURL());
                
                safeReply(message, { embeds: [rewardEmbed] });
            } catch (error) {
                console.error('Failed to assign level reward role:', error);
            }
        }
    }
}

/**
 * Add warning to user
 * @param {string} userId - User ID
 * @param {Object} warningData - Warning information
 */
function addWarning(userId, warningData) {
    const userData = getUserData(userId);
    userData.warnings.push({
        ...warningData,
        id: Date.now(),
        date: new Date()
    });
    updateUserData(userId, { warnings: userData.warnings });
    return userData.warnings.length;
}

/**
 * Remove warning from user
 * @param {string} userId - User ID
 * @param {number} warningId - Warning ID to remove
 */
function removeWarning(userId, warningId) {
    const userData = getUserData(userId);
    userData.warnings = userData.warnings.filter(w => w.id !== warningId);
    updateUserData(userId, { warnings: userData.warnings });
    return userData.warnings.length;
}

/**
 * Clear all warnings for user
 * @param {string} userId - User ID
 */
function clearWarnings(userId) {
    const userData = getUserData(userId);
    const count = userData.warnings.length;
    userData.warnings = [];
    updateUserData(userId, { warnings: [] });
    return count;
}

/**
 * Get user warnings
 * @param {string} userId - User ID
 * @returns {Array} - Array of warnings
 */
function getWarnings(userId) {
    const userData = getUserData(userId);
    return userData.warnings || [];
}

/**
 * Get leaderboard data
 * @param {number} limit - Number of users to return
 * @returns {Array} - Sorted array of user data
 */
function getLeaderboard(limit = 10) {
    const { userData } = require('./storage.js');
    
    return Array.from(userData.entries())
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
}

/**
 * Calculate XP needed for next level
 * @param {number} currentLevel - Current user level
 * @returns {number} - XP needed for next level
 */
function calculateXPForLevel(currentLevel) {
    return Math.pow((currentLevel + 1) / 0.1, 2);
}

/**
 * Calculate level from XP
 * @param {number} xp - Current XP
 * @returns {number} - Level
 */
function calculateLevelFromXP(xp) {
    return Math.floor(0.1 * Math.sqrt(xp));
}

/**
 * Get user rank
 * @param {string} userId - User ID
 * @returns {number} - User rank (1-based)
 */
function getUserRank(userId) {
    const leaderboard = getLeaderboard(1000); // Get all users
    const userIndex = leaderboard.findIndex(user => user.userId === userId);
    return userIndex === -1 ? null : userIndex + 1;
}

/**
 * Reset user data (use with caution)
 * @param {string} userId - User ID
 */
function resetUserData(userId) {
    updateUserData(userId, {
        warnings: [],
        level: 1,
        xp: 0,
        messages: 0,
        lastMessage: 0
    });
}

module.exports = {
    handleExperience,
    handleLevelUp,
    checkLevelRewards,
    addWarning,
    removeWarning,
    clearWarnings,
    getWarnings,
    getLeaderboard,
    calculateXPForLevel,
    calculateLevelFromXP,
    getUserRank,
    resetUserData,
    updateServerStats // Re-export for convenience
};