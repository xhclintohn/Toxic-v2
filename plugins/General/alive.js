const fs = require('fs');
const path = require('path');
const { botname } = require('../../config/settings');

module.exports = {
  name: 'alive',
  aliases: ['bot', 'test', 'isalive', 'status'],
  description: 'Checks if the bot is alive and running',
  run: async (context) => {
    const { client, m, prefix, pict } = context;
    const bName = botname || 'Toxic-MD';

    try {
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const secs = Math.floor(uptime % 60);
      const uptimeStr = `${days}d ${hours}h ${mins}m ${secs}s`;

      const caption = `╭───(    TOXIC-MD    )───\n├───≫ I'ᴍ Aʟɪᴠᴇ ≪───\n├ \n├ Yo ${m.pushName}, I'm up and running.\n├ Been alive for ${uptimeStr}.\n├ Type *${prefix}menu* if you need\n├ help, which you probably do.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

      if (pict && Buffer.isBuffer(pict)) {
        await client.sendMessage(m.chat, {
          image: pict,
          caption: caption,
          mentions: [m.sender]
        }, { quoted: m });
      } else {
        await client.sendMessage(m.chat, {
          text: caption,
          mentions: [m.sender]
        }, { quoted: m });
      }

      const possibleAudioPaths = [
        path.join(__dirname, '..', 'xh_clinton', 'test.mp3'),
        path.join(process.cwd(), 'xh_clinton', 'test.mp3'),
        path.join(__dirname, 'xh_clinton', 'test.mp3'),
      ];

      for (const audioPath of possibleAudioPaths) {
        try {
          if (fs.existsSync(audioPath)) {
            await client.sendMessage(m.chat, {
              audio: { url: audioPath },
              ptt: true,
              mimetype: 'audio/mpeg',
              fileName: 'toxic-alive.mp3'
            }, { quoted: m });
            break;
          }
        } catch (err) {}
      }

    } catch (error) {
      await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Cʀᴀsʜᴇᴅ ≪───\n├ \n├ Something broke, ${m.pushName}.\n├ Error: ${error.message}\n├ Try again when I feel like it.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
  }
};
