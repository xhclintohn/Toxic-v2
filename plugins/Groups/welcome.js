import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getGroupSettings, updateGroupSetting } from '../../database/config.js';
import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args, prefix } = context;
        const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
        const jid = m.chat;

        const fmt = (msg) =>
            `╭───(    TOXIC-MD    )───\n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        try {
            if (!jid.endsWith('@g.us')) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                return await client.sendMessage(m.chat, { text: fmt("Oi! 😤 This only works in groups. Not your personal DM, genius. 🖕") }, { quoted: fq });
            }

            const groupSettings = await getGroupSettings(jid);
            const isEnabled = groupSettings?.welcome === true || groupSettings?.welcome === 1;
            const value = args[0]?.toLowerCase();

            if (value === 'on' || value === 'off') {
                const action = value === 'on';
                if (isEnabled === action) {
                    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                    return await client.sendMessage(m.chat, { text: fmt(`Bruh 🙄 Welcome is already ${value.toUpperCase()} in this group. Pay attention!`) }, { quoted: fq });
                }
                await updateGroupSetting(jid, 'welcome', action);
                await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
                return await client.sendMessage(m.chat, {
                    text: fmt(`Welcome messages ${value.toUpperCase()}! 🔥 ${action ? "New members better brace themselves 😈" : "No more warm welcomes. Cold group energy 🧊"}`)
                }, { quoted: fq });
            }

            const _msg = generateWAMessageFromContent(
                m.chat,
                {
                    interactiveMessage: {
                        body: { text: fmt(`Welcome Status: *${isEnabled ? 'ON 🥶' : 'OFF 😴'}*\n├ Toggles welcome messages for new members in this group.`) },
                        footer: { text: '' },
                        nativeFlowMessage: {
                            buttons: [{
                                name: 'single_select',
                                buttonParamsJson: JSON.stringify({
                                    title: 'Choose an option',
                                    sections: [{
                                        rows: [
                                            { title: 'ON ✅', id: `${prefix}welcome on` },
                                            { title: 'OFF ❌', id: `${prefix}welcome off` }
                                        ]
                                    }]
                                })
                            }]
                        }
                    }
                },
                { quoted: fq }
            );
            await client.relayMessage(m.chat, _msg.message, { messageId: _msg.key.id });
        } catch (error) {
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            console.error('Toxic-MD: Error in welcome.js:', error);
            await client.sendMessage(m.chat, { text: fmt(`Something crashed. Typical. 💀 Error: ${error.message}`) }, { quoted: fq });
        }
    });
};
