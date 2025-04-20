const { getSettings, getGroupSetting, updateGroupSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    try {
        await ownerMiddleware(context, async () => {
            const { client, m, args } = context;
            const value = args[0]?.toLowerCase();
            const jid = m.chat;

            if (!jid.endsWith('@g.us')) {
                return await client.sendMessage(m.chat, {
                    text: `❌ *This command can only be used in groups!*\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓O𝐗𝐈𝐂-MD 𝐕3*`
                }, { quoted: m });
            }

            const settings = await getSettings();
            const prefix = settings.prefix;

            let groupSettings = await getGroupSetting(jid);
            let isEnabled = groupSettings?.antiforeign === true; // Will be false by default if undefined

            const Myself = await client.decodeJid(client.user.id);
            const groupMetadata = await client.groupMetadata(m.chat);
            const userAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
            const isBotAdmin = userAdmins.includes(Myself);

            if (value === 'on' && !isBotAdmin) {
                return await client.sendMessage(m.chat, {
                    text: `❌ *I need admin privileges to enable Antiforeign!*\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓O𝐗𝐈𝐂-MD 𝐕3*`
                }, { quoted: m });
            }

            if (value === 'on' || value === 'off') {
                const action = value === 'on';

                if (isEnabled === action) {
                    return await client.sendMessage(m.chat, {
                        text: `✅ *Antiforeign is already ${value.toUpperCase()}!*\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *T𝐎𝐗𝐈𝐂-MD 𝐕3*`
                    }, { quoted: m });
                }

                await updateGroupSetting(jid, 'antiforeign', action);
                await client.sendMessage(m.chat, {
                    text: `✅ *Antiforeign has been turned ${value.toUpperCase()} for this group!*\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *T𝐎𝐗𝐈𝐂-MD 𝐕3*`
                }, { quoted: m });
            } else {
                await client.sendMessage(m.chat, {
                    text: `🔐 *Antiforeign Status*\n\nCurrent setting: *${isEnabled ? 'ON' : 'OFF'}*\n\nUse *${prefix}antiforeign on* or *${prefix}antiforeign off* to change it.\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *�{T𝐎𝐗𝐈𝐂-MD 𝐕3*`
                }, { quoted: m });
            }
        });
    } catch (error) {
        console.error('Error in antiforeign command:', error);
        await context.client.sendMessage(context.m.chat, {
            text: `⚠️ *Oops! Failed to process command:* ${error.message}\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *�{T𝐎𝐗𝐈𝐂-MD 𝐕3*`
        }, { quoted: context.m });
    }
};