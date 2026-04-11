const { makeEffect } = require('../../lib/toxicApi');

const EFFECTS = [
    { id: 'glossysilver', name: 'glossysilver', aliases: ['silverglossy', 'shinysilver'], label: 'GLOSSY SILVER 3D', desc: 'Generate glossy silver 3D text' },
    { id: 'glitchtext', name: 'glitchtext', aliases: ['glitch3d', 'digitalglitch'], label: 'DIGITAL GLITCH', desc: 'Generate digital glitch text effect' },
    { id: 'advancedglow', name: 'advancedglow', aliases: ['glowtext', 'advglow'], label: 'ADVANCED GLOW', desc: 'Generate advanced glowing text' },
    { id: 'neonglitch', name: 'neonglitch', aliases: ['glitchneon'], label: 'NEON GLITCH', desc: 'Generate neon glitch text effect' },
    { id: 'gradienttext', name: 'gradienttext', aliases: ['gradtext', 'gradient3d'], label: 'GRADIENT TEXT 3D', desc: 'Generate 3D gradient text' },
    { id: 'glowingtext', name: 'glowingtext', aliases: ['glowing', 'textglow'], label: 'GLOWING TEXT', desc: 'Generate glowing text effect' },
    { id: 'luxurygold', name: 'luxurygold', aliases: ['goldluxury', 'luxgold', 'goldtext'], label: 'LUXURY GOLD', desc: 'Generate luxury gold text' },
    { id: 'multicolored', name: 'multicolored', aliases: ['multicolor', 'coloredneon'], label: 'MULTICOLORED NEON', desc: 'Generate multicolored neon text' },
    { id: 'galaxy', name: 'galaxytext', aliases: ['galaxyeffect'], label: 'GALAXY WALLPAPER', desc: 'Generate galaxy style text' },
    { id: 'makingneon', name: 'makingneon', aliases: ['royalneon', 'royaltext'], label: 'ROYAL NEON TEXT', desc: 'Generate royal neon text' },
    { id: 'writetext', name: 'writetext', aliases: ['wetglass', 'glastext'], label: 'WET GLASS TEXT', desc: 'Generate text on wet glass effect' },
    { id: 'underwater', name: 'underwater', aliases: ['underwatertext', 'deeptext'], label: '3D UNDERWATER', desc: 'Generate 3D underwater text' },
    { id: 'pixelglitch', name: 'pixelglitch', aliases: ['pixeltext', 'pixglitch'], label: 'PIXEL GLITCH', desc: 'Generate pixel glitch text' },
    { id: 'summerbeach', name: 'summerbeach', aliases: ['beachtext', 'summertext'], label: 'SUMMER BEACH', desc: 'Generate summer beach text' },
    { id: 'papercut', name: 'papercut', aliases: ['papertext', '3dpapercut'], label: '3D PAPER CUT', desc: 'Generate 3D paper cut text' },
    { id: 'effectclouds', name: 'cloudtext', aliases: ['cloudstext', 'skytext'], label: 'CLOUDS TEXT', desc: 'Generate text in clouds effect' },
    { id: 'gradientLogo3d', name: 'gradientlogo', aliases: ['gradlogo3d'], label: 'GRADIENT LOGO 3D', desc: 'Generate 3D gradient logo' },
    { id: 'galaxystyle', name: 'galaxylogo', aliases: ['galaxystylelogo'], label: 'GALAXY STYLE LOGO', desc: 'Generate galaxy style logo' },
    { id: 'colorfulneon', name: 'colorfulneon', aliases: ['coloredneons', 'colorfulneons'], label: 'COLORFUL NEON', desc: 'Generate colorful neon text' },
    { id: 'greenNeon', name: 'greenneon', aliases: ['neongreen', 'greenlight'], label: 'GREEN NEON', desc: 'Generate green neon text' },
    { id: '1917', name: '1917text', aliases: ['nineteenseventeen'], label: '1917 STYLE', desc: 'Generate 1917 style text' },
    { id: 'texteffect', name: 'texteffect', aliases: ['hologram', 'hologramtext'], label: '3D HOLOGRAM', desc: 'Generate 3D hologram text' },
    { id: 'lighteffect', name: 'lighteffect', aliases: ['lighttext', 'greenlight2'], label: 'LIGHT EFFECT', desc: 'Generate green light effect' },
    { id: 'logomaker', name: 'bearlogo', aliases: ['logomaker3d'], label: 'BEAR LOGO MAKER', desc: 'Generate a bear mascot logo' },
    { id: 'typographytext', name: 'typography', aliases: ['typographytext', 'typotext'], label: 'TYPOGRAPHY TEXT', desc: 'Generate typography pavement text' },
    { id: 'hackerAvatar', name: 'hackerneon', aliases: ['hacker', 'cyanneon'], label: 'HACKER NEON', desc: 'Generate anonymous hacker cyan neon', extraParams: { style: '1' } },
    { id: 'blackpinklogo', name: 'blackpinklogo', aliases: ['bpllogo', 'bplogo'], label: 'BLACKPINK LOGO', desc: 'Generate Blackpink style logo' },
    { id: 'blackpinkstyle', name: 'blackpinkstyle', aliases: ['bpstyle', 'kpopstyle'], label: 'BLACKPINK STYLE', desc: 'Generate Blackpink style text' },
    { id: 'deletingtext', name: 'erasertext', aliases: ['deletingtext', 'erasetext'], label: 'ERASER DELETING', desc: 'Generate eraser deleting text effect' },
    { id: 'cartoonstyle', name: 'cartoonstyle', aliases: ['cartoontext', 'graffitistyle'], label: 'CARTOON GRAFFITI', desc: 'Generate cartoon graffiti text' },
];

const built = [];
for (const eff of EFFECTS) {
    built.push({
        name: eff.name,
        aliases: eff.aliases || [],
        description: eff.desc,
        run: (function(effect) {
            return async (context) => {
                const { client, m, text, prefix } = context;
                if (!text) return m.reply(
                    `╭───(    TOXIC-MD    )───\n├───≫ ${effect.label} ≪───\n├ \n├ Usage: ${prefix}${effect.name} YourText\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                );
                if (text.length > 50) return m.reply('╭───(    TOXIC-MD    )───\n├ Text too long. Max 50 chars.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
                try {
                    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
                    const imgBuffer = await makeEffect(effect.id, text.trim(), effect.extraParams || {});
                    await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                    await client.sendMessage(m.chat, {
                        image: imgBuffer,
                        caption: `╭───(    TOXIC-MD    )───\n├───≫ ${effect.label} ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                    }, { quoted: m });
                } catch (err) {
                    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ${effect.label} ≪───\n├ Failed: ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                }
            };
        })(eff)
    });
}

module.exports = built;
