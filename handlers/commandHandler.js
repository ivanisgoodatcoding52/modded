const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(commandsPath);
    
    let totalCommands = 0;
    
    for (const folder of commandFolders) {
        const commandsFolder = path.join(commandsPath, folder);
        
        // Skip if not a directory
        if (!fs.statSync(commandsFolder).isDirectory()) continue;
        
        const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsFolder, file);
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                totalCommands++;
                
                // Set aliases if they exist
                if (command.data.aliases) {
                    for (const alias of command.data.aliases) {
                        client.commands.set(alias, command);
                    }
                }
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
    
    console.log(`Loaded ${totalCommands} commands from ${commandFolders.length} categories`);
};