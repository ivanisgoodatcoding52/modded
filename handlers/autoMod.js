const { safeReply } = require('../utils/permissions.js');
const { logAutoModAction } = require('../utils/logger.js');
const { 
    addProfanityTracking, 
    getProfanityTracking, 
    clearProfanityTracking,
    userMessageTimestamps 
} = require('../data/storage.js');

/**
 * Main auto-moderation check function
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 */
async function checkMessage(message, client) {
    if (message.author.bot || !client.config.autoModeration) return;
    
    try {
        // Run all auto-mod checks with error handling
        await Promise.allSettled([
            checkSlurs(message, client),
            checkProfanity(message, client),
            checkSpam(message, client),
            checkCaps(message, client),
            checkMassMentions(message, client),
            checkRepeatedMessages(message, client)
        ]);
    } catch (error) {
        console.error('Error in auto-moderation:', error);
    }
}

/**
 * Check for slurs and take immediate action
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 */
async function checkSlurs(message, client) {
    if (!client.config.slurs || !Array.isArray(client.config.slurs)) return;
    
    const content = message.content.toLowerCase();
    
    // Simple but effective slur detection
    const containsSlur = client.config.slurs.some(slur => {
        try {
            const cleanSlur = slur.toLowerCase().trim();
            if (!cleanSlur) return false;
            
            // Method 1: Direct match
            if (content.includes(cleanSlur)) return true;
            
            // Method 2: Check for variations with common substitutions
            const variations = [
                cleanSlur.replace(/[o0]/g, '[o0]'),
                cleanSlur.replace(/[i1l]/g, '[i1l]'),
                cleanSlur.replace(/[e3]/g, '[e3]'),
                cleanSlur.replace(/[a@]/g, '[a@]'),
                cleanSlur.replace(/[s5$]/g, '[s5$]')
            ];
            
            // Create safe regex patterns
            for (const variation of variations) {
                try {
                    const safePattern = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(safePattern, 'i');
                    if (regex.test(content)) return true;
                } catch (regexError) {
                    // Skip invalid patterns
                    continue;
                }
            }
            
            // Method 3: Check for spaced out versions (n i g g e r -> nigg)
            const spacedPattern = cleanSlur.split('').join('\\s*');
            try {
                const spacedRegex = new RegExp(spacedPattern, 'i');
                if (spacedRegex.test(content)) return true;
            } catch (regexError) {
                // Ignore regex errors
            }
            
            return false;
        } catch (error) {
            console.warn(`Error checking slur "${slur}":`, error.message);
            return false;
        }
    });
    
    if (!containsSlur) return;
    
    try {
        // Delete message immediately
        await message.delete().catch(() => {
            console.log('Could not delete slur message - may lack permissions');
        });
    } catch (error) {
        console.error('Failed to delete slur message:', error);
    }
    
    const member = message.guild.members.cache.get(message.author.id);
    if (!member) return;
    
    try {
        let actionTaken = '';
        
        switch (client.config.slurAction) {
            case 'ban':
                if (member.bannable) {
                    await member.ban({ 
                        reason: 'Automatic: Hate speech detected', 
                        deleteMessageDays: 1 
                    });
                    actionTaken = 'banned permanently';
                }
                break;
                
            case 'kick':
                if (member.kickable) {
                    await member.kick('Automatic: Hate speech detected');
                    actionTaken = 'kicked from server';
                }
                break;
                
            case 'timeout':
            default:
                if (member.moderatable) {
                    await member.timeout(86400000, 'Automatic: Hate speech detected'); // 24 hours
                    actionTaken = 'timed out for 24 hours';
                }
                break;
        }
        
        if (actionTaken) {
            const warningMsg = await safeReply(message, 
                `**${message.author.username}** has been ${actionTaken} for using hate speech.`
            );
            
            // Delete warning after 10 seconds
            if (warningMsg) {
                setTimeout(() => warningMsg.delete().catch(() => {}), 10000);
            }
            
            // Log the action
            await logAutoModAction(
                message.guild, 
                'Hate Speech Detection', 
                message.author, 
                actionTaken, 
                'Inappropriate language detected and removed',
                client
            ).catch(console.error);
            
            // Try to DM the user
            try {
                await message.author.send(
                    `**You have been ${actionTaken}** from **${message.guild.name}**\n\n` +
                    `**Reason:** Use of inappropriate language\n` +
                    `**Note:** This type of language violates our community guidelines.\n\n` +
                    `If you believe this was a mistake, please contact the server moderators.`
                );
            } catch (dmError) {
                // User has DMs disabled or blocked the bot
            }
        } else {
            // If no action could be taken, at least log it
            console.log(`Slur detected from ${message.author.tag} but no action could be taken`);
        }
    } catch (error) {
        console.error('Failed to take action for slur:', error);
    }
}

/**
 * Check for excessive profanity
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 */
async function checkProfanity(message, client) {
    if (!client.config.antiSpam || !client.config.profanity || !Array.isArray(client.config.profanity)) return;
    
    const content = message.content.toLowerCase();
    
    // Count profanity words in the message
    let profanityCount = 0;
    const detectedWords = [];
    
    for (const word of client.config.profanity) {
        try {
            const cleanWord = word.toLowerCase().trim();
            if (!cleanWord) continue;
            
            // Use word boundaries to avoid false positives (e.g., "class" containing "ass")
            const wordRegex = new RegExp(`\\b${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            const matches = content.match(wordRegex);
            
            if (matches) {
                profanityCount += matches.length;
                detectedWords.push(...matches);
            }
        } catch (regexError) {
            // Fallback to simple includes check
            if (content.includes(word.toLowerCase())) {
                profanityCount++;
                detectedWords.push(word);
            }
        }
    }
    
    if (profanityCount === 0) return;
    
    const userId = message.author.id;
    const now = Date.now();
    
    // Add to profanity tracking
    for (let i = 0; i < profanityCount; i++) {
        addProfanityTracking(userId, now);
    }
    
    // Get recent profanity usage
    const timestamps = getProfanityTracking(userId);
    const recentTimestamps = timestamps.filter(
        timestamp => now - timestamp < client.config.profanityTimeWindow
    );
    
    if (recentTimestamps.length >= client.config.profanityLimit) {
        const member = message.guild.members.cache.get(userId);
        if (!member || !member.moderatable) return;
        
        try {
            let actionTaken = '';
            
            switch (client.config.profanityAction) {
                case 'ban':
                    if (member.bannable) {
                        await member.ban({ 
                            reason: 'Automatic: Excessive profanity', 
                            deleteMessageDays: 1 
                        });
                        actionTaken = 'banned for excessive profanity';
                    }
                    break;
                    
                case 'kick':
                    if (member.kickable) {
                        await member.kick('Automatic: Excessive profanity');
                        actionTaken = 'kicked for excessive profanity';
                    }
                    break;
                    
                case 'timeout':
                default:
                    await member.timeout(3600000, 'Automatic: Excessive profanity'); // 1 hour
                    actionTaken = 'timed out for 1 hour';
                    break;
            }
            
            if (actionTaken) {
                // Delete the triggering message
                await message.delete().catch(() => {});
                
                const warningMsg = await safeReply(message,
                    `**${message.author.username}** has been ${actionTaken} for excessive profanity usage.`
                );
                
                if (warningMsg) {
                    setTimeout(() => warningMsg.delete().catch(() => {}), 10000);
                }
                
                // Clear profanity tracking
                clearProfanityTracking(userId);
                
                // Log the action
                await logAutoModAction(
                    message.guild, 
                    'Excessive Profanity', 
                    message.author, 
                    actionTaken, 
                    `${client.config.profanityLimit}+ inappropriate words in ${client.config.profanityTimeWindow/60000} minutes`,
                    client
                ).catch(console.error);
                
                // Try to DM the user
                try {
                    await message.author.send(
                        `**You have been ${actionTaken}** from **${message.guild.name}**\n\n` +
                        `**Reason:** Excessive use of inappropriate language\n` +
                        `**Limit:** ${client.config.profanityLimit} words per ${client.config.profanityTimeWindow/60000} minutes\n\n` +
                        `Please keep your language appropriate in the server.`
                    );
                } catch (dmError) {
                    // User has DMs disabled
                }
            }
        } catch (error) {
            console.error('Failed to take action for excessive profanity:', error);
        }
    } else {
        // Give warning if close to limit
        const remainingUses = client.config.profanityLimit - recentTimestamps.length;
        if (remainingUses <= 1 && profanityCount > 0) {
            const warningMsg = await safeReply(message,
                `${message.author}, please watch your language. ` +
                `**Warning ${recentTimestamps.length}/${client.config.profanityLimit}** - Next violation may result in punishment.`
            );
            
            if (warningMsg) {
                setTimeout(() => warningMsg.delete().catch(() => {}), 8000);
            }
        }
    }
}

/**
 * Check for spam (rapid message sending)
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 */
async function checkSpam(message, client) {
    if (!client.config.antiSpam) return;
    
    const userId = message.author.id;
    const now = Date.now();
    
    if (!userMessageTimestamps.has(userId)) {
        userMessageTimestamps.set(userId, []);
    }
    
    const timestamps = userMessageTimestamps.get(userId);
    timestamps.push(now);
    
    // Keep only messages from last 15 seconds
    const timeWindow = 15000; // 15 seconds
    const recent = timestamps.filter(time => now - time < timeWindow);
    userMessageTimestamps.set(userId, recent);
    
    // Configuration: more than 8 messages in 15 seconds = spam
    const messageLimit = 8;
    
    if (recent.length > messageLimit) {
        const member = message.guild.members.cache.get(userId);
        if (!member || !member.moderatable) return;
        
        try {
            // Timeout for 10 minutes
            await member.timeout(600000, 'Automatic: Spam detection');
            
            const warningMsg = await safeReply(message, 
                `**${message.author.username}** has been timed out for 10 minutes due to spamming.`
            );
            
            if (warningMsg) {
                setTimeout(() => warningMsg.delete().catch(() => {}), 10000);
            }
            
            // Clear message timestamps
            userMessageTimestamps.delete(userId);
            
            // Log the action
            await logAutoModAction(
                message.guild, 
                'Spam Detection', 
                message.author, 
                'timed out for 10 minutes', 
                `${recent.length} messages in ${timeWindow/1000} seconds (limit: ${messageLimit})`,
                client
            ).catch(console.error);
            
        } catch (error) {
            console.error('Failed to timeout spammer:', error);
        }
    }
}

/**
 * Check for excessive caps
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 */
async function checkCaps(message, client) {
    // Only check messages longer than 10 characters
    if (message.content.length < 10) return;
    
    const capsCount = (message.content.match(/[A-Z]/g) || []).length;
    const totalLetters = (message.content.match(/[A-Za-z]/g) || []).length;
    
    // Only check if message has significant letter content
    if (totalLetters < 5) return;
    
    const capsPercentage = capsCount / totalLetters;
    
    // More than 80% caps in messages with 5+ letters
    if (capsPercentage > 0.8) {
        try {
            await message.delete().catch(() => {
                console.log('Could not delete caps message - may lack permissions');
            });
            
            const warningMsg = await safeReply(message, 
                `${message.author}, please don't use excessive CAPS! Your message was deleted.`
            );
            
            if (warningMsg) {
                setTimeout(() => warningMsg.delete().catch(() => {}), 6000);
            }
            
            // Log the action
            await logAutoModAction(
                message.guild, 
                'Excessive Caps', 
                message.author, 
                'message deleted', 
                `${Math.round(capsPercentage * 100)}% caps in message (${capsCount}/${totalLetters} letters)`,
                client
            ).catch(console.error);
            
        } catch (error) {
            console.error('Failed to handle caps message:', error);
        }
    }
}

/**
 * Check for mass mentions
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 */
async function checkMassMentions(message, client) {
    const mentionLimit = 5; // Max mentions allowed
    const totalMentions = message.mentions.users.size + message.mentions.roles.size;
    
    if (totalMentions > mentionLimit) {
        const member = message.guild.members.cache.get(message.author.id);
        if (!member || !member.moderatable) return;
        
        try {
            // Delete message
            await message.delete().catch(() => {});
            
            // Timeout for 5 minutes
            await member.timeout(300000, 'Automatic: Mass mentions');
            
            const warningMsg = await safeReply(message, 
                `**${message.author.username}** has been timed out for mass mentions (${totalMentions} mentions).`
            );
            
            if (warningMsg) {
                setTimeout(() => warningMsg.delete().catch(() => {}), 10000);
            }
            
            // Log the action
            await logAutoModAction(
                message.guild, 
                'Mass Mentions', 
                message.author, 
                'timed out for 5 minutes', 
                `${totalMentions} mentions in one message (limit: ${mentionLimit})`,
                client
            ).catch(console.error);
            
        } catch (error) {
            console.error('Failed to handle mass mentions:', error);
        }
    }
}

/**
 * Check for repeated messages
 * @param {Message} message - Discord message
 * @param {Client} client - Discord client
 */
async function checkRepeatedMessages(message, client) {
    // Simple repeated message check
    const userId = message.author.id;
    const content = message.content.toLowerCase().trim();
    
    // Skip very short messages
    if (content.length < 3) return;
    
    // Store last 5 messages per user
    if (!userMessageTimestamps.has(`${userId}_content`)) {
        userMessageTimestamps.set(`${userId}_content`, []);
    }
    
    const userMessages = userMessageTimestamps.get(`${userId}_content`);
    userMessages.push({ content, time: Date.now() });
    
    // Keep only last 5 messages from last 2 minutes
    const twoMinutesAgo = Date.now() - 120000;
    const recentMessages = userMessages
        .filter(msg => msg.time > twoMinutesAgo)
        .slice(-5);
    
    userMessageTimestamps.set(`${userId}_content`, recentMessages);
    
    // Check if last 3 messages are identical
    if (recentMessages.length >= 3) {
        const lastThree = recentMessages.slice(-3);
        if (lastThree.every(msg => msg.content === content)) {
            try {
                await message.delete().catch(() => {});
                
                const warningMsg = await safeReply(message, 
                    `${message.author}, please stop repeating the same message!`
                );
                
                if (warningMsg) {
                    setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
                }
                
                // Clear their message history
                userMessageTimestamps.delete(`${userId}_content`);
                
            } catch (error) {
                console.error('Failed to handle repeated message:', error);
            }
        }
    }
}

module.exports = {
    checkMessage,
    checkSlurs,
    checkProfanity,
    checkSpam,
    checkCaps,
    checkMassMentions,
    checkRepeatedMessages
};