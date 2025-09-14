const { Events, EmbedBuilder } = require('discord.js');
const { updateServerStats } = require('../data/userData.js');
const { safeSend } = require('../utils/permissions.js');
const { joinTimestamps } = require('../data/storage.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        // Update server stats
        updateServerStats(member.guild.id, 'joins');
        
        // Raid protection
        if (client.config.raidProtection) {
            const now = Date.now();
            const guildId = member.guild.id;
            
            if (!joinTimestamps.has(guildId)) {
                joinTimestamps.set(guildId, []);
            }
            
            const timestamps = joinTimestamps.get(guildId);
            timestamps.push(now);
            
            // Keep only joins from the last 30 seconds
            const recent = timestamps.filter(time => now - time < 30000);
            joinTimestamps.set(guildId, recent);
            
            // If more than 5 joins in 30 seconds, alert
            if (recent.length > 5) {
                const logChannel = member.guild.channels.cache.find(ch => 
                    ch.name === client.config.logChannelName
                );
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🚨 POTENTIAL RAID DETECTED')
                        .setDescription(
                            `${recent.length} users joined in the last 30 seconds!\n` +
                            `Consider enabling verification or lockdown mode.`
                        )
                        .setColor('#ff4757')
                        .addFields(
                            { name: 'Recent Joins', value: recent.length.toString(), inline: true },
                            { name: 'Time Window', value: '30 seconds', inline: true }
                        )
                        .setTimestamp();
                    
                    safeSend(logChannel, { embeds: [embed] });
                }
            }
        }
        
        // Auto role assignment
        if (client.config.autoRole) {
            const role = member.guild.roles.cache.find(r => r.name === client.config.autoRole);
            if (role && member.guild.members.me.permissions.has('ManageRoles')) {
                try {
                    await member.roles.add(role, 'Auto-role assignment');
                } catch (error) {
                    console.error(`Failed to assign auto-role to ${member.user.tag}:`, error);
                }
            }
        }
        
        // Welcome message
        if (client.config.welcomeMessages) {
            const welcomeChannel = member.guild.channels.cache.find(ch => 
                ch.name === client.config.welcomeChannelName
            );
            
            if (welcomeChannel) {
                const embed = new EmbedBuilder()
                    .setTitle(`Welcome to ${member.guild.name}! 🎉`)
                    .setDescription(
                        `Hey ${member}, welcome to our server!\n\n` +
                        `• Make sure to read the rules\n` +
                        `• Introduce yourself if you'd like\n` +
                        `• Have fun and be respectful! 😊`
                    )
                    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                    .setColor('#00d2d3')
                    .setFooter({ text: `Member #${member.guild.memberCount}` })
                    .setTimestamp();
                
                safeSend(welcomeChannel, { embeds: [embed] });
            }
        }
        
        // Initialize user data if using level system
        if (client.config.levelSystem) {
            const { getUserData } = require('../data/storage.js');
            getUserData(member.id); // This will create default data if not exists
        }
        
        console.log(`👋 ${member.user.tag} joined ${member.guild.name}`);
    },
};