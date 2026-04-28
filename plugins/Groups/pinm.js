import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default {
  name: 'pinm',
  aliases: ['pinmessage', 'pinmsg'],
  description: 'Pin a message in the group (reply to a message)',
  run: async (context) => {
    const { client, m, prefix, IsGroup } = context;
    const fq = getFakeQuoted(m);
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

    if (!IsGroup) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
      return client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├ \n├ This command can only be used in groups.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: fq });
    }

    if (!m.quoted) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
      return client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├ \n├ Please reply to the message you want to pin.\n├ Example: ${prefix}pinm 86400\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: fq });
    }

    const args = m.body.trim().split(/\s+/);
    let time = 86400;

    if (args[1]) {
      const input = args[1].toLowerCase();
      if (input === '24h' || input === '1d') time = 86400;
      else if (input === '7d') time = 604800;
      else if (input === '30d') time = 2592000;
      else if (!isNaN(input)) time = parseInt(input);
    }

    try {
      const messageKey = {
        remoteJid: m.chat,
        id: m.quoted.id,
        fromMe: m.quoted.fromMe || false,
        participant: m.quoted.sender
      };

      await client.sendMessage(m.chat, { pin: messageKey, type: 1, time });

      const durationLabel = time === 86400 ? '24 hours' : time === 604800 ? '7 days' : time === 2592000 ? '30 days' : `${time}s`;
      await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├ \n├ ✅ Message pinned successfully!\n├ Duration: ${durationLabel}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: fq });

    } catch (error) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├ \n├ ❌ Failed to pin message.\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: fq });
    }
  }
};
