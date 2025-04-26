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
        if (!text || text.trim() === '') {
            return await client.sendMessage(m.chat, { 
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, you brain-dead fuck, where’s the text? Try *${prefix}${context.command} SomeText* or fuck off! 😡` 
            }, { quoted: m });
        }

        const cleanedText = text.trim().slice(0, 50);
        if (cleanedText.length < 3) {
            return await client.sendMessage(m.chat, { 
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ What’s this weak-ass text, ${m.pushName}? At least 3 characters, dumbass! 🙄` 
            }, { quoted: m });
        }

        const apiUrl = `https://api.giftedtech.web.id/api/ephoto360/${endpoint}?apikey=gifted&text=${encodeURIComponent(cleanedText)}`;
        const response = await axios.get(apiUrl);

        if (response.data.status !== 200 || !response.data.success || !response.data.result?.image_url) {
            return await client.sendMessage(m.chat, { 
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit, the API fucked up! No ${effectName} logo for you, loser. Try again later. 😒\n\nPowered by *Even Toxic-MD*` 
            }, { quoted: m });
        }

        const imageUrl = response.data.result.image_url;

        const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ Here’s your damn *${effectName}* logo, ${m.pushName}! Don’t waste my time again, you prick! 😤\n` +
                       `📸 *Text*: ${cleanedText}\n` +
                       `🔗 *Source*: Even Toxic-MD’s magic, bitches!\n` +
                       `◈━━━━━━━━━━━━━━━━◈\nPowered by *Even Toxic-MD*`;

        await client.sendMessage(m.chat, { 
            image: { url: imageUrl }, 
            caption: caption 
        }, { quoted: m });

    } catch (error) {
        console.error(`Error in ${context.command} command:`, error);
        await client.sendMessage(m.chat, { 
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you broke it! Error: ${error.message}. Fix your shit and try again, you slacker! 😡\n` +
                  `Check https://github.com/xhclintohn/Toxic-v2 for help.\n` +
                  `◈━━━━━━━━━━━━━━━━◈\nPowered by *Even Toxic-MD*` 
        }, { quoted: m });
    }
}

module.exports = logoCommands;