const { Events, EmbedBuilder } = require('discord.js');
const { updateServerStats } = require('../data/userData.js');
const { safeSend } = require('../utils/permissions.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        // Update server stats
        updateServerStats(member.guild.id, 'leaves');
        
        // Log member leave
        const logChannel = member.guild.channels.cache.find(ch => 
            ch.name === client.config.logChannelName
        );
        
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('Member Left')
                .setDescription(`${member.user.tag} has left the server`)
                .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
                .setColor('#ff6b6b')
                .addFields(
                    { name: 'User ID', value: member.user.id, inline: true },
                    { name: 'Account Created', value: member.user.createdAt.toLocaleDateString(), inline: true },
                    { name: 'Joined Server', value: member.joinedAt ? member.joinedAt.toLocaleDateString() : 'Unknown', inline: true }
                )
                .setFooter({ text: `Members now: ${member.guild.memberCount}` })
                .setTimestamp();
            
            safeSend(logChannel, { embeds: [embed] });
        }
        
        console.log(`${member.user.tag} left ${member.guild.name}`);
    },
};