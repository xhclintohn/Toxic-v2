const middleware = require('../../utils/botUtil/middleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
  name: 'remove',
  aliases: ['kick', 'yeet', 'boot', 'removemember'],
  description: 'Removes a user from a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, prefix } = context;
      const fq = getFakeQuoted(m);

      const normalizeJid = (jid) => {
        if (!jid) return '';
        return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
      };

      let user = null;
      if (m.mentionedJid && m.mentionedJid.length > 0) user = m.mentionedJid[0];
      if (!user && m.quoted?.sender) user = m.quoted.sender;

      if (!user) return m.reply(`╭───(    TOXIC-MD    )───\n├ Mention or quote a user. ${prefix}kick @user\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

      const botJid = normalizeJid(client.user.id);
      const targetJid = normalizeJid(user);

      if (targetJid === botJid) return m.reply(`╭───(    TOXIC-MD    )───\n├ You can't kick me, loser.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

      const groupMetadata = await client.groupMetadata(m.chat);
      const participants = groupMetadata.participants;
      const realMember = participants.find(p => normalizeJid(p.jid || p.id) === targetJid);
      const actualJid = realMember ? normalizeJid(realMember.jid || realMember.id) : targetJid;

      try {
        await client.groupParticipantsUpdate(m.chat, [actualJid], 'remove');
        await client.sendMessage(m.chat, {
          text: `╭───(    TOXIC-MD    )───\n├───≫ KICKED ≪───\n├ \n├ @${actualJid.split('@')[0]} got yeeted out.\n├ Good riddance, trash.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          mentions: [actualJid]
        }, { quoted: fq });
      } catch (error) {
        await m.reply(`╭───(    TOXIC-MD    )───\n├ Couldn't kick @${actualJid.split('@')[0]}.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
    });
  }
};
