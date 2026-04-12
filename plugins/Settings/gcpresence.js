const { getSettings, getGroupSettings, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

const formatStylishReply = (message) => {
    return `╭───(    TOXIC-MD    )───\n├ ${message}\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
};

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args } = context;
        const fq = getFakeQuoted(m);
        const value = args[0]?.toLowerCase();
        const jid = m.chat;
        
        const settings = await getSettings();
        const prefix = settings.prefix || '.';
        
        let groupSettings = {};
        let isEnabled = false;
        
        if (jid.endsWith('@g.us')) {
            groupSettings = await getGroupSettings(jid);
            isEnabled = groupSettings.gcpresence === true;
        }
        
        if (value === 'on' || value === 'off') {
            const action = value === 'on';
            
            if (isEnabled === action) {
                return await m.reply(formatStylishReply(`Already ${value.toUpperCase()}`));
            }
            
            if (jid.endsWith('@g.us')) {
                await updateGroupSetting(jid, 'gcpresence', action);
                await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
                await m.reply(formatStylishReply(`Group: ${value.toUpperCase()}`));
            } else {
                await m.reply(formatStylishReply(`DMs: Always ON`));
            }
            
        } else {
            const status = jid.endsWith('@g.us') ? (isEnabled ? '✅ ON' : '❌ OFF') : '✅ ON (DMs)';
            
            await client.sendMessage(jid, {
                interactiveMessage: {
                    header: formatStylishReply(`GCPresence Settings\n\nStatus: ${status}\n\n• Group: Fake typing/recording\n• DMs: Always enabled`),
                    footer: "Tσxιƈ-ɱԃȥ",
                    buttons: [
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🟢 TURN ON",
                                id: `${prefix}gcpresence on`
                            })
                        },
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🔴 TURN OFF",
                                id: `${prefix}gcpresence off`
                            })
                        }
                    ]
                }
            }, { quoted: fq });
        }
    });
};