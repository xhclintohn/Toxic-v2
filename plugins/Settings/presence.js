import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getSettings, updateSetting } from '../../database/config.js';
import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args, prefix } = context;
    const fq = getFakeQuoted(m);

    const formatStylishReply = (message) => {
      return `╭───(    TOXIC-MD    )───\n├ ${message}\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    };

    try {
      const settings = await getSettings();
      if (!settings || Object.keys(settings).length === 0) {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("Database is fucked, no settings found. Fix it, loser.") },
          { quoted: fq, ad: true }
        );
      }

      const validPresenceValues = ['online', 'offline', 'recording', 'typing'];
      const value = args.join(" ").toLowerCase();

      if (validPresenceValues.includes(value)) {
        if (settings.presence === value) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`Presence is already ${value.toUpperCase()}, genius. Stop wasting my time.`) },
            { quoted: fq, ad: true }
          );
        }

        await updateSetting('presence', value);
        await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.reactKey } });
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply(`Presence set to ${value.toUpperCase()}. Bot’s flexing that status now!`) },
          { quoted: fq, ad: true }
        );
      }

      const _msg = generateWAMessageFromContent(
        m.chat,
        {
            interactiveMessage: {
                body: { text: formatStylishReply(`Presence is ${settings.presence ? settings.presence.toUpperCase() },
                footer: { text: '' },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: 'Choose an option',
                                sections: [{
                                    rows: [
                                                                                                { title: 'ONLINE 🟢', id: `${prefix}presence online` },
                                                        { title: 'OFFLINE ⚫', id: `${prefix}presence offline` },
                                                        { title: 'RECORDING 🎙️', id: `${prefix}presence recording` },
                                                        { title: 'TYPING ⌨️', id: `${prefix}presence typing` }
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
    } catch (error) {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("Shit broke, couldn’t update presence. Database or something’s fucked. Try later.") },
        { quoted: fq, ad: true }
      );
    }
  });
};