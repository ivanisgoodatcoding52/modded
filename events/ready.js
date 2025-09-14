const { Events } = require('discord.js');
const { initializeData } = require('../data/storage.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Logged in as ${client.user.tag}`);
        client.user.setActivity('use !help for commands', { type: 3 });
        
        // Initialize data storage
        initializeData(client);
        
        console.log('teorkermelw rkewnjoriwek');
        console.log(`${client.guilds.cache.size} servers with ${client.users.cache.size} users`);
    },
};