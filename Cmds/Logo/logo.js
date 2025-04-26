const axios = require('axios');

const logoCommands = [
    {
        name: 'advancedglow',
        aliases: ['glowlogo', 'gloweffect'],
        description: 'Slaps an Advanced Glow logo together, you lazy fuck!',
        run: async (context) => createLogo(context, 'advancedglow', 'Advanced Glow')
    },
    {
        name: 'glitchtext',
        aliases: ['glitchlogo', 'glitch'],
        description: 'Makes a Glitch Text logo, don’t screw it up, moron!',
        run: async (context) => createLogo(context, 'glitchtext', 'Glitch Text')
    },
    {
        name: 'blackpinklogo',
        aliases: ['bplogo', 'blackpink'],
        description: 'Blackpink Logo for you wannabe K-pop losers!',
        run: async (context) => createLogo(context, 'blackpinklogo', 'Blackpink Logo')
    },
    {
        name: 'writetext',
        aliases: ['writelogo', 'textlogo'],
        description: 'Write Text logo, don’t waste my damn time!',
        run: async (context) => createLogo(context, 'writetext', 'Write Text')
    },
    {
        name: 'glossysilver',
        aliases: ['silverlogo', 'silver'],
        description: 'Glossy Silver logo, you shiny piece of trash!',
        run: async (context) => createLogo(context, 'glossysilver', 'Glossy Silver')
    },
    {
        name: 'underwater',
        aliases: ['waterlogo', 'water'],
        description: 'Underwater logo, drown in it, you idiot!',
        run: async (context) => createLogo(context, 'underwater', 'Underwater')
    },
    {
        name: 'effectclouds',
        aliases: ['cloudlogo', 'clouds'],
        description: 'Effect Clouds logo, you airy-headed fuck!',
        run: async (context) => createLogo(context, 'effectclouds', 'Effect Clouds')
    },
    {
        name: 'sandsummer',
        aliases: ['sandlogo', 'summer'],
        description: 'Sand Summer logo, you beach bum asshole!',
        run: async (context) => createLogo(context, 'sandsummer', 'Sand Summer')
    },
    {
        name: 'galaxystyle',
        aliases: ['galaxylogo', 'galaxy'],
        description: 'Galaxy Style logo, you space-case loser!',
        run: async (context) => createLogo(context, 'galaxystyle', 'Galaxy Style')
    },
    {
        name: 'lighteffect',
        aliases: ['lightlogo', 'light'],
        description: 'Light Effect logo, you dim-witted prick!',
        run: async (context) => createLogo(context, 'lighteffect', 'Light Effect')
    }
];

async function createLogo(context, endpoint, effectName) {
    const { client, m, text, prefix } = context;

    try {
        // Input validation
        if (!text || text.trim() === '') {
            return await client.sendMessage(m.chat, { 
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, you brain-dead fuck, where’s the text? Try *${prefix}${context.command} SomeText* or fuck off! 😡` 
            }, { quoted: m });
        }

        // Clean input (limit to reasonable length)
        const cleaned Anime (Truncated, due to exceeding maximum length) output = {
  "result": {
    "image_url": "https://e1.yotools.net/images/user_image/2025/04/680d36a5a735b.jpg",
    "image_code": "2564.jpg"
  }
}

