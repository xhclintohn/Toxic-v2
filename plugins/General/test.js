const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'test',
  aliases: ['tst', 'testcmd'],
  description: 'Sends a test voice note to check if you’re worthy',
  run: async (context) => {
    const { client, m, botname, text } = context;

    if (text) {
      return client.sendMessage(m.chat, { text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Yo, ${m.pushName}, what’s this extra garbage? Just say .test, you clown.` }, { quoted: m });
    }

    try {
      const possibleAudioPaths = [
        path.join(__dirname, 'xh_clinton', 'test.mp3'),
        path.join(process.cwd(), 'xh_clinton', 'test.mp3'),
        path.join(__dirname, '..', 'xh_clinton', 'test.mp3'),
      ];

      let audioPath = null;
      for (const possiblePath of possibleAudioPaths) {
        if (fs.existsSync(possiblePath)) {
          audioPath = possiblePath;
          break;
        }
      }

      if (audioPath) {
        console.log(`✅ Found audio file at: ${audioPath}`);
        await client.sendMessage(m.chat, {
          audio: { url: audioPath },
          ptt: true,
          mimetype: 'audio/mpeg',
          fileName: 'test.mp3'
        }, { quoted: m });
      } else {
        console.error('❌ Audio file not found at any of the following paths:', possibleAudioPaths);
        await client.sendMessage(m.chat, {
          text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Shit, couldn’t find test.mp3 in xh_clinton/. Fix your files, you slacker.\n\nPowered by *${botname}*`
        }, { quoted: m });
      }
    } catch (error) {
      console.error('Error in test command:', error);
      await client.sendMessage(m.chat, {
        text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Yo, something fucked up the test audio. Try again later, dumbass.\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  }
};