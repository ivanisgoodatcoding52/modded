const { Events } = require('discord.js');
const { getTicketByChannel, deleteTicket } = require('../data/storage.js');
const { logAction } = require('../utils/logger.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction, client);
        } else if (interaction.isChatInputCommand()) {
            // Handle slash commands if you add them later
            await handleSlashCommand(interaction, client);
        }
    },
};

/**
 * Handle button interactions
 * @param {ButtonInteraction} interaction - Button interaction
 * @param {Client} client - Discord client
 */
async function handleButtonInteraction(interaction, client) {
    try {
        if (interaction.customId === 'close_ticket') {
            await handleCloseTicket(interaction, client);
        } else if (interaction.customId.startsWith('poll_')) {
            await handlePollVote(interaction, client);
        } else if (interaction.customId === 'confirm_nuke') {
            await handleNukeConfirm(interaction, client);
        } else if (interaction.customId === 'cancel_nuke') {
            await interaction.update({ 
                content: '❌ Channel nuke cancelled.', 
                embeds: [], 
                components: [] 
            });
        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: '❌ An error occurred while processing this interaction.', 
                ephemeral: true 
            });
        }
    }
}

/**
 * Handle ticket close button
 * @param {ButtonInteraction} interaction - Button interaction
 * @param {Client} client - Discord client
 */
async function handleCloseTicket(interaction, client) {
    const ticketData = getTicketByChannel(interaction.channel.id);
    
    if (!ticketData) {
        return await interaction.reply({ 
            content: '❌ Ticket data not found.', 
            ephemeral: true 
        });
    }
    
    const [ticketId, ticket] = ticketData;
    
    // Check if user can close ticket (ticket owner or moderator)
    const canClose = interaction.user.id === ticket.userId || 
                    interaction.member.permissions.has('ModerateMembers') ||
                    interaction.member.roles.cache.some(role => role.name === client.config.moderatorRole);
    
    if (!canClose) {
        return await interaction.reply({ 
            content: '❌ You can only close your own ticket or you need moderator permissions.', 
            ephemeral: true 
        });
    }
    
    await interaction.reply('🔒 Closing ticket in 5 seconds...');
    
    setTimeout(async () => {
        try {
            // Delete ticket from data
            deleteTicket(ticketId);
            
            // Log ticket closure
            await logAction(
                interaction.guild, 
                'Ticket Closed', 
                null, 
                interaction.user, 
                `Ticket #${ticketId} closed`,
                client
            );
            
            // Delete the channel
            await interaction.channel.delete();
        } catch (error) {
            console.error('Error closing ticket:', error);
        }
    }, 5000);
}

/**
 * Handle poll vote
 * @param {ButtonInteraction} interaction - Button interaction  
 * @param {Client} client - Discord client
 */
async function handlePollVote(interaction, client) {
    const pollId = interaction.customId.replace('poll_', '');
    const { polls } = require('../data/storage.js');
    const poll = polls.get(pollId);
    
    if (!poll) {
        return await interaction.reply({ 
            content: '❌ This poll has expired or been deleted.', 
            ephemeral: true 
        });
    }
    
    // For now, just acknowledge the vote
    // Full poll system would be implemented in commands/interactive/poll.js
    await interaction.reply({ 
        content: '✅ Vote recorded!', 
        ephemeral: true 
    });
}

/**
 * Handle nuke confirmation
 * @param {ButtonInteraction} interaction - Button interaction
 * @param {Client} client - Discord client
 */
async function handleNukeConfirm(interaction, client) {
    try {
        const channelName = interaction.channel.name;
        const channelPosition = interaction.channel.position;
        const channelParent = interaction.channel.parent;
        const channelType = interaction.channel.type;
        
        await interaction.reply('💥 Nuking channel...');
        
        // Delete the channel
        await interaction.channel.delete();
        
        // Recreate the channel
        const newChannel = await interaction.guild.channels.create({
            name: channelName,
            type: channelType,
            parent: channelParent,
            position: channelPosition
        });
        
        // Send nuke message in new channel
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle('💥 Channel Nuked')
            .setDescription(`Channel nuked by ${interaction.user.tag}`)
            .setColor('#ff4757')
            .setImage('https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif')
            .setTimestamp();
        
        await newChannel.send({ embeds: [embed] });
        
        // Log the action
        await logAction(
            interaction.guild, 
            'Channel Nuke', 
            null, 
            interaction.user, 
            `Nuked and recreated #${channelName}`,
            client
        );
        
    } catch (error) {
        console.error('Error nuking channel:', error);
        await interaction.followUp({ 
            content: '❌ Failed to nuke channel.', 
            ephemeral: true 
        });
    }
}

/**
 * Handle slash commands (placeholder for future implementation)
 * @param {ChatInputCommandInteraction} interaction - Slash command interaction
 * @param {Client} client - Discord client
 */
async function handleSlashCommand(interaction, client) {
    // Placeholder for slash command handling
    // This would be implemented when adding slash commands
    await interaction.reply({ 
        content: 'Slash commands are not implemented yet. Use prefix commands instead!', 
        ephemeral: true 
    });
}