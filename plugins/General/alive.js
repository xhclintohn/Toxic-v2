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

      const caption = `*${bName} Aʟɪᴠᴇ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ I'ᴍ Aʟɪᴠᴇ ≪───\n> \`々\` Yo ${m.pushName}, I'm up and running.\n> \`々\` Been alive for ${uptimeStr}.\n> \`々\` Type *${prefix}menu* if you need\n> \`々\` help, which you probably do.\n> \`々\` Powered by xh_clinton.\n╰──────────────────☉`;

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
      await m.reply(`*${bName} Eʀʀᴏʀ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Cʀᴀsʜᴇᴅ ≪───\n> \`々\` Something broke, ${m.pushName}.\n> \`々\` Error: ${error.message}\n> \`々\` Try again when I feel like it.\n╰──────────────────☉`);
    }
  }
};
