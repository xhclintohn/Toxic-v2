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

            await client.sendMessage(m.chat, {
                  listMessage: {
                      title: `Wᴇʟᴄᴏᴍᴇ Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}`,
                      description: `Toggles welcome messages. Turn on or off below.`,
                      buttonText: 'Choose an option',
                      listType: 1,
                      sections: [{
                          title: 'Options',
                          rows: [
                              { title: 'ON ✅', description: 'Enable welcome messages', rowId: `${prefix}welcome on` },
                              { title: 'OFF ❌', description: 'Disable welcome messages', rowId: `${prefix}welcome off` }
                          ]
                      }],
                      footer: '©𝐏𝐨𝐰𝐞𝐫𝐞ꀠ𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
                  }
              }, { quoted: fq });
              await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        } catch (error) {
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            console.error('Toxic-MD: Error in welcome.js:', error);
            await client.sendMessage(m.chat, { text: fmt(`Something crashed. Typical. 💀 Error: ${error.message}`) }, { quoted: fq });
        }
    });
};
