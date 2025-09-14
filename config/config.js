module.exports = {
    // Bot Settings
    token: 'GET YOUR OWN BOT TOKEN I AINT PROVIDEING ONE',
    prefix: '!',
    
    moderatorRole: 'Moderator',
    logChannelName: 'mod-logs',
    welcomeChannelName: 'welcome',
    autoRole: 'Member',
    
    profanityLimit: 3,
    profanityTimeWindow: 300000, // 5 minutes
    slurAction: 'ban', // 'ban', 'kick', or 'timeout'
    profanityAction: 'timeout', // 'ban', 'kick', or 'timeout'
    maxWarnings: 3,
    
    raidProtection: true,
    antiSpam: true,
    autoModeration: true,
    levelSystem: true,
    welcomeMessages: true,
    
    // guys i didnt type this out it was ai i swear

    slurs: [
        'n1gg', 'n!gg', 'n*gg', 'nigg', 'n-word',
        'ch1nk', 'ch!nk', 'chink', 'sp1c', 'sp!c', 'spic',
        'k1ke', 'k!ke', 'kike', 'f4gg', 'f@gg', 'fagg',
        'wetback', 'beaner', 'raghead', 'towelhead',
        'gook', 'slope', 'zipperhead'
    ],
    
    profanity: [
        'fuck', 'f*ck', 'f**k', 'f***', 'fck', 'fuk', 'fack',
        'shit', 's*it', 's**t', 'sh*t', 'sht', 'shyt',
        'damn', 'd*mn', 'dmn', 'dang', 'ass', 'arse', '@ss', 'a**', 'azz',
        'bitch', 'b*tch', 'b**ch', 'btch', 'biatch',
        'crap', 'cr*p', 'crp', 'piss', 'p*ss', 'pss',
        'bastard', 'b*stard', 'bstrd', 'whore', 'wh*re', 'hoe',
        'slut', 'sl*t', 'slt'
    ],
    
    eightBallResponses: [
        "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
        "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
        "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
        "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
        "Don't count on it.", "My reply is no.", "My sources say no.",
        "Outlook not so good.", "Very doubtful."
    ],
    
    jokes: [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the scarecrow win an award? He was outstanding in his field!",
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call a fake noodle? An impasta!",
        "Why did the math book look so sad? Because it had too many problems!",
        "What do you call a bear with no teeth? A gummy bear!",
        "Why can't a bicycle stand up by itself? It's two tired!",
        "What do you call a sleeping bull? A bulldozer!",
        "Why did the banana go to the doctor? It wasn't peeling well!",
        "What's orange and sounds like a parrot? A carrot!"
    ],
    
    facts: [
        "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!",
        "A group of flamingos is called a 'flamboyance'.",
        "Octopuses have three hearts and blue blood.",
        "Bananas are berries, but strawberries aren't.",
        "A shrimp's heart is in its head.",
        "It would take 9 years to walk to the moon.",
        "A cloud can weigh more than a million pounds.",
        "There are more possible games of chess than atoms in the observable universe.",
        "Wombat poop is cube-shaped.",
        "The longest recorded flight of a chicken is 13 seconds."
    ],
    
    quotes: [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
        { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
        { text: "You learn more from failure than from success.", author: "Unknown" },
        { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" }
    ],
    
    colors: {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db',
        moderation: '#e74c3c',
        automod: '#ff4757',
        fun: '#f1c40f',
        utility: '#3498db',
        level: '#ffd700'
    }
};
