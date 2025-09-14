const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config/config.js');
const commandHandler = require('./handlers/commandHandler.js');
const eventHandler = require('./handlers/eventHandler.js');

// Create client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ] 
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Bot configuration
client.config = config;

// Load handlers
commandHandler(client);
eventHandler(client);

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
    console.log('shutting down');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('shutting down...');
    client.destroy();
    process.exit(0);
});

// Login
client.login(config.token);