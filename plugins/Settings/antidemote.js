import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getSettings, getGroupSettings, updateGroupSetting } from '../../database/config.js';
import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args } = context;
    const fq = getFakeQuoted(m);
    const value = args[0]?.toLowerCase();
    const jid = m.chat;

    const formatStylishReply = (title, message) => {
      return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    };

    if (!jid.endsWith('@g.us')) {
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
      return await client.sendMessage(m.chat, { text: formatStylishReply("ANTIDEMOTE", "Epic fail, loser!\n├ This command is for groups only, moron!") }, { quoted: fq });
    }

    const settings = await getSettings();
    const prefix = settings.prefix;

    let groupSettings = await getGroupSettings(jid);
    let isEnabled = groupSettings?.antidemote === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await client.sendMessage(m.chat, { text: formatStylishReply("ANTIDEMOTE", `Antidemote is already ${value.toUpperCase()}, you brainless fool!\n├ Quit wasting my time!`) }, { quoted: fq });
      }

      await updateGroupSetting(jid, 'antidemote', action ? 'true' : 'false');
      await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.reactKey } });
      return await client.sendMessage(m.chat, { text: formatStylishReply("ANTIDEMOTE", `Antidemote ${value.toUpperCase()}!\n├ Demotions are under my watch, king!`) }, { quoted: fq });
    }

    const _msg = generateWAMessageFromContent(
        m.chat,
        {
            interactiveMessage: {
                body: { text: formatStylishReply("ANTIDEMOTE", `Antidemote's ${isEnabled ? 'ON' : 'OFF'} right now. Pick one, fool!`) },
                footer: { text: '' },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: 'Choose an option',
                                sections: [{
                                    rows: [
                                                                                                { title: 'ON ✅', id: `${prefix}antidemote on` },
                                                        { title: 'OFF ❌', id: `${prefix}antidemote off` }
                                    ]
                                }]
                            })
                        }
                    ]
                }
            }
        },
        { quoted: fq }
      );
      await client.relayMessage(m.chat, _msg.message, { messageId: _msg.key.id });
  });
};
