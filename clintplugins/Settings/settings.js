const { getSettings, getSudoUsers, getBannedUsers } = require('../../Database/config');

module.exports = async (context) => {
    const { client, m } = context;

    const settings = await getSettings();
    const prefix = settings.prefix || '.';
    const botName = process.env.BOTNAME || settings.botname || 'Toxic-MD';
    const sudoUsers = await getSudoUsers();
    const bannedUsers = await getBannedUsers();
    const groups = await client.groupFetchAllParticipating();
    const groupCount = Object.keys(groups).length;

    const response = 
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *${botName} Settings* 🔥\n` +
        `┗━━━━━━━━━━━━━━━┛\n\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Botname*: ${botName}\n` +
        `│❒ Ex: ${prefix}bot\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Prefix*: ${settings.prefix || 'None'}\n` +
        `│❒ Ex: ${prefix}prefix !\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Autoread*: ${settings.autoread ? 'ON' : 'OFF'}\n` +
        `│❒ Ex: ${prefix}autoread on\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Autoview Status*: ${settings.autoview ? 'ON' : 'OFF'}\n` +
        `│❒ Ex: ${prefix}autoview on\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Autolike Status*: ${settings.autolike ? 'ON' : 'OFF'}\n` +
        `│❒ Ex: ${prefix}autolike on\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *React Emoji*: ${settings.reactEmoji || 'None'}\n` +
        `│❒ Ex: ${prefix}reaction 😈\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Sticker Watermark*: ${settings.packname || 'None'}\n` +
        `│❒ Ex: ${prefix}setpackname Toxic-MD\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Autobio*: ${settings.autobio ? 'ON' : 'OFF'}\n` +
        `│❒ Ex: ${prefix}autobio on\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Anticall*: ${settings.anticall ? 'ON' : 'OFF'}\n` +
        `│❒ Ex: ${prefix}anticall on\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Chatbot PM*: ${settings.chatbotpm ? 'ON' : 'OFF'}\n` +
        `│❒ Ex: ${prefix}chatbotpm on\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Presence*: ${settings.presence || 'Offline'}\n` +
        `│❒ Ex: ${prefix}setpresence typing\n` +
        `┗━━━━━━━━━━━━━━━┛\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Mode*: ${settings.mode || 'Public'}\n` +
        `│❒ Ex: ${prefix}mode private\n` +
        `┗━━━━━━━━━━━━━━━┛\n\n` +

        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ *Stats* 📊\n` +
        `│❒ *Sudo Users*: ${sudoUsers.length > 0 ? sudoUsers.join(', ') : 'None'}\n` +
        `│❒ *Banned Users*: ${bannedUsers.length}\n` +
        `│❒ *Total Groups*: ${groupCount}\n` +
        `┗━━━━━━━━━━━━━━━┛`;

    await m.reply(response, null, {
        buttons: [
            { buttonId: `${prefix}anticall on`, buttonText: { displayText: 'Anticall ON' }, type: 1 },
            { buttonId: `${prefix}chatbotpm on`, buttonText: { displayText: 'Chatbot PM ON' }, type: 1 },
            { buttonId: `${prefix}mode private`, buttonText: { displayText: 'Set Private Mode' }, type: 1 }
        ],
        headerType: 1
    });
};
