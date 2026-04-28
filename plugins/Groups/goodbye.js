import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getGroupSettings, updateGroupSetting } from '../../database/config.js';
import middleware from '../../utils/botUtil/middleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    await middleware(context, async () => {
        const { client, m, args, prefix } = context;
        const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
        const jid = m.chat;

        const fmt = (msg) =>
            `╭───(    TOXIC-MD    )───\n├───≫ Gᴏᴏᴅʙʏᴇ ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        try {
            if (!jid.endsWith('@g.us')) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                return await client.sendMessage(m.chat, { text: fmt("Oi! This only works in groups. Not your personal DM, genius.") }, { quoted: fq });
            }

            const groupSettings = await getGroupSettings(jid);
            const isEnabled = groupSettings?.goodbye === true || groupSettings?.goodbye === 1;
            const value = args[0]?.toLowerCase();

            if (value === 'on' || value === 'off') {
                const action = value === 'on';
                if (isEnabled === action) {
                    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                    return await client.sendMessage(m.chat, { text: fmt(`Bruh 🙄 Goodbye is already ${value.toUpperCase()} in this group. Were you dropped as a kid?`) }, { quoted: fq });
                }
                await updateGroupSetting(jid, 'goodbye', action);
                await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
                return await client.sendMessage(m.chat, {
                    text: fmt(`Goodbye messages ${value.toUpperCase()}! 🔥 ${action ? "Leavers will get roasted on their way out 😈" : "Let them leave in silence like the nobodies they are 🧊"}`)
                }, { quoted: fq });
            }

            await client.sendMessage(m.chat, {
                  listMessage: {
                      title: `Gᴏᴏᴅʙʏᴇ Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}`,
                      description: `Toggles goodbye messages. Turn on or off below.`,
                      buttonText: 'Choose an option',
                      listType: 1,
                      sections: [{
                          title: 'Options',
                          rows: [
                              { title: 'ON ✅', description: 'Enable goodbye messages', rowId: `${prefix}goodbye on` },
                              { title: 'OFF ❌', description: 'Disable goodbye messages', rowId: `${prefix}goodbye off` }
                          ]
                      }],
                      footer: '©𝐏𝐨𝐰𝐞𝐫𝐞ꀠ𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
                  }
              }, { quoted: fq });
              await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        } catch (error) {
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            console.error('Toxic-MD: Error in goodbye.js:', error);
            await client.sendMessage(m.chat, { text: fmt(`Something crashed. Typical. 💀 Error: ${error.message}`) }, { quoted: fq });
        }
    });
};
