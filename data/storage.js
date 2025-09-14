// In-memory data storage (replace with database in production)
const userData = new Map();
const serverStats = new Map();
const tempChannels = new Map();
const polls = new Map();
const reminders = new Map();
const tickets = new Map();

// Tracking maps
const userProfanityCount = new Map();
const userMessageTimestamps = new Map();
const joinTimestamps = new Map();

/**
 * Initialize data storage for all guilds
 * @param {Client} client - Discord client
 */
function initializeData(client) {
    client.guilds.cache.forEach(guild => {
        if (!serverStats.has(guild.id)) {
            serverStats.set(guild.id, {
                messages: 0,
                joins: 0,
                leaves: 0,
                bans: 0,
                kicks: 0,
                warnings: 0,
                timeouts: 0,
                created: Date.now()
            });
        }
    });
    
    console.log(`Initialized data for ${client.guilds.cache.size} servers`);
    
    // Start cleanup interval
    startCleanupInterval();
}

/**
 * Get user data
 * @param {string} userId - User ID
 * @returns {Object} - User data object
 */
function getUserData(userId) {
    if (!userData.has(userId)) {
        userData.set(userId, {
            warnings: [],
            level: 1,
            xp: 0,
            messages: 0,
            joinedAt: Date.now(),
            lastMessage: 0
        });
    }
    return userData.get(userId);
}

/**
 * Update user data
 * @param {string} userId - User ID
 * @param {Object} data - Data to update
 */
function updateUserData(userId, data) {
    const current = getUserData(userId);
    userData.set(userId, { ...current, ...data });
}

/**
 * Get server stats
 * @param {string} guildId - Guild ID
 * @returns {Object} - Server stats object
 */
function getServerStats(guildId) {
    if (!serverStats.has(guildId)) {
        serverStats.set(guildId, {
            messages: 0,
            joins: 0,
            leaves: 0,
            bans: 0,
            kicks: 0,
            warnings: 0,
            timeouts: 0,
            created: Date.now()
        });
    }
    return serverStats.get(guildId);
}

/**
 * Update server stats
 * @param {string} guildId - Guild ID
 * @param {string} statType - Type of stat to increment
 * @param {number} amount - Amount to increment by
 */
function updateServerStats(guildId, statType, amount = 1) {
    const stats = getServerStats(guildId);
    if (stats[statType] !== undefined) {
        stats[statType] += amount;
        serverStats.set(guildId, stats);
    }
}

/**
 * Create a new poll
 * @param {string} pollId - Poll ID
 * @param {Object} pollData - Poll data
 */
function createPoll(pollId, pollData) {
    polls.set(pollId, {
        ...pollData,
        votes: new Map(),
        createdAt: Date.now()
    });
}

/**
 * Get poll data
 * @param {string} pollId - Poll ID
 * @returns {Object|null} - Poll data or null
 */
function getPoll(pollId) {
    return polls.get(pollId) || null;
}

/**
 * Delete a poll
 * @param {string} pollId - Poll ID
 */
function deletePoll(pollId) {
    polls.delete(pollId);
}

/**
 * Create a reminder
 * @param {string} reminderId - Reminder ID
 * @param {Object} reminderData - Reminder data
 */
function createReminder(reminderId, reminderData) {
    reminders.set(reminderId, reminderData);
}

/**
 * Get all reminders for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of reminders
 */
function getUserReminders(userId) {
    return Array.from(reminders.entries())
        .filter(([id, reminder]) => reminder.userId === userId)
        .map(([id, reminder]) => ({ id, ...reminder }));
}

/**
 * Delete a reminder
 * @param {string} reminderId - Reminder ID
 */
function deleteReminder(reminderId) {
    reminders.delete(reminderId);
}

/**
 * Create a ticket
 * @param {string} ticketId - Ticket ID
 * @param {Object} ticketData - Ticket data
 */
function createTicket(ticketId, ticketData) {
    tickets.set(ticketId, {
        ...ticketData,
        createdAt: Date.now()
    });
}

/**
 * Get ticket by channel ID
 * @param {string} channelId - Channel ID
 * @returns {Object|null} - Ticket data or null
 */
function getTicketByChannel(channelId) {
    return Array.from(tickets.entries())
        .find(([id, ticket]) => ticket.channelId === channelId);
}

/**
 * Delete a ticket
 * @param {string} ticketId - Ticket ID
 */
function deleteTicket(ticketId) {
    tickets.delete(ticketId);
}

/**
 * Add temporary channel
 * @param {string} channelId - Channel ID
 * @param {Object} channelData - Channel data
 */
function addTempChannel(channelId, channelData) {
    tempChannels.set(channelId, {
        ...channelData,
        createdAt: Date.now()
    });
}

/**
 * Get temporary channels for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of temp channels
 */
function getUserTempChannels(userId) {
    return Array.from(tempChannels.entries())
        .filter(([id, channel]) => channel.ownerId === userId)
        .map(([id, channel]) => ({ id, ...channel }));
}

/**
 * Delete temporary channel
 * @param {string} channelId - Channel ID
 */
function deleteTempChannel(channelId) {
    tempChannels.delete(channelId);
}

/**
 * Get tracking data for profanity
 * @param {string} userId - User ID
 * @returns {Array} - Array of timestamps
 */
function getProfanityTracking(userId) {
    return userProfanityCount.get(userId) || [];
}

/**
 * Add profanity tracking
 * @param {string} userId - User ID
 * @param {number} timestamp - Timestamp
 */
function addProfanityTracking(userId, timestamp) {
    if (!userProfanityCount.has(userId)) {
        userProfanityCount.set(userId, []);
    }
    userProfanityCount.get(userId).push(timestamp);
}

/**
 * Clear profanity tracking for user
 * @param {string} userId - User ID
 */
function clearProfanityTracking(userId) {
    userProfanityCount.delete(userId);
}

/**
 * Cleanup old data
 */
function startCleanupInterval() {
    setInterval(() => {
        const now = Date.now();
        const oneHour = 3600000;
        const oneDay = 86400000;
        
        // Clean profanity tracking (older than config window)
        for (const [userId, timestamps] of userProfanityCount.entries()) {
            const recent = timestamps.filter(time => now - time < 300000); // 5 minutes default
            if (recent.length === 0) {
                userProfanityCount.delete(userId);
            } else {
                userProfanityCount.set(userId, recent);
            }
        }
        
        // Clean message timestamps (older than 1 hour)
        for (const [userId, timestamps] of userMessageTimestamps.entries()) {
            const recent = timestamps.filter(time => now - time < oneHour);
            if (recent.length === 0) {
                userMessageTimestamps.delete(userId);
            } else {
                userMessageTimestamps.set(userId, recent);
            }
        }
        
        // Clean join timestamps (older than 1 hour)
        for (const [guildId, timestamps] of joinTimestamps.entries()) {
            const recent = timestamps.filter(time => now - time < oneHour);
            if (recent.length === 0) {
                joinTimestamps.delete(guildId);
            } else {
                joinTimestamps.set(guildId, recent);
            }
        }
        
        // Clean expired reminders
        for (const [reminderId, reminder] of reminders.entries()) {
            if (now > reminder.time) {
                reminders.delete(reminderId);
            }
        }
        
        // Clean old polls (older than 24 hours)
        for (const [pollId, poll] of polls.entries()) {
            if (now - poll.createdAt > oneDay) {
                polls.delete(pollId);
            }
        }
        
        console.log('🧹 Data cleanup completed');
    }, 600000); // Run every 10 minutes
}

module.exports = {
    // Data maps (for direct access if needed)
    userData,
    serverStats,
    tempChannels,
    polls,
    reminders,
    tickets,
    userProfanityCount,
    userMessageTimestamps,
    joinTimestamps,
    
    // Functions
    initializeData,
    getUserData,
    updateUserData,
    getServerStats,
    updateServerStats,
    createPoll,
    getPoll,
    deletePoll,
    createReminder,
    getUserReminders,
    deleteReminder,
    createTicket,
    getTicketByChannel,
    deleteTicket,
    addTempChannel,
    getUserTempChannels,
    deleteTempChannel,
    getProfanityTracking,
    addProfanityTracking,
    clearProfanityTracking
};