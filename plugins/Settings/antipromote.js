const { getSettings, getGroupSettings, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args } = context;
    const fq = getFakeQuoted(m);
    const value = args[0]?.toLowerCase();
    const jid = m.chat;

    const formatStylishReply = (title, message) => {
      return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    };

    if (!jid.endsWith('@g.us')) {
      return await client.sendMessage(m.chat, { text: formatStylishReply("ANTIPROMOTE", "Nice try, idiot!\n├ This command is for groups only, you moron!") }, { quoted: fq });
    }

    const settings = await getSettings();
    const prefix = settings.prefix;

    let groupSettings = await getGroupSettings(jid);
    let isEnabled = groupSettings?.antipromote === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await client.sendMessage(m.chat, { text: formatStylishReply("ANTIPROMOTE", `Antipromote is already ${value.toUpperCase()}, you clueless moron!\n├ Stop spamming my commands!`) }, { quoted: fq });
      }

      await updateGroupSetting(jid, 'antipromote', action ? 'true' : 'false');
      await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
      return await client.sendMessage(m.chat, { text: formatStylishReply("ANTIPROMOTE", `Antipromote ${value.toUpperCase()}!\n├ Promotions are under my control, king!`) }, { quoted: fq });
    }

    const buttons = [
      { buttonId: `${prefix}antipromote on`, buttonText: { displayText: "ON" }, type: 1 },
      { buttonId: `${prefix}antipromote off`, buttonText: { displayText: "OFF" }, type: 1 },
    ];

    await client.sendMessage(m.chat, {
      text: formatStylishReply("ANTIPROMOTE", `Antipromote's ${isEnabled ? 'ON' : 'OFF'} right now. Pick one, fool!`),
      buttons,
      headerType: 1,
      viewOnce: true,
    }, { quoted: fq });
  });
};
