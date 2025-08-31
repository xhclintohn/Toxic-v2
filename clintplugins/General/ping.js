const { getSettings } = require('../../Database/config');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

module.exports = {
  name: 'ping',
  aliases: ['p'],
  description: 'Checks the bot’s response time, uptime, and status with a sassy vibe',
  run: async (context) => {
    const { client, m, toxicspeed } = context;

    // FFmpeg function for media conversion
    const ffmpeg = (buffer, args = [], ext = '', ext2 = '') => {
      return new Promise(async (resolve, reject) => {
        let tmpFile, outFile;
        try {
          const tmpDir = path.join(__dirname, '../tmp/');
          // Create tmp directory if it doesn't exist
          await fs.promises.mkdir(tmpDir, { recursive: true });

          tmpFile = path.join(tmpDir, `${+new Date()}.${ext}`);
          outFile = `${tmpFile}.${ext2}`;
          await fs.promises.writeFile(tmpFile, buffer);

          const ffmpegProcess = spawn('ffmpeg', [
            '-y',
            '-i', tmpFile,
            ...args,
            outFile
          ]);

          // Capture FFmpeg stderr for detailed error logging
          let stderr = '';
          ffmpegProcess.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          ffmpegProcess.on('error', (err) => {
            reject(new Error(`FFmpeg error: ${err.message}\n${stderr}`));
          });

          ffmpegProcess.on('close', async (code) => {
            try {
              if (code !== 0) {
                reject(new Error(`FFmpeg exited with code ${code}\n${stderr}`));
                return;
              }
              const output = await fs.promises.readFile(outFile);
              resolve(output);
            } catch (e) {
              reject(e);
            } finally {
              // Clean up files immediately
              try {
                if (await fs.promises.stat(tmpFile).catch(() => false)) {
                  await fs.promises.unlink(tmpFile);
                }
                if (await fs.promises.stat(outFile).catch(() => false)) {
                  await fs.promises.unlink(outFile);
                }
              } catch (cleanupError) {
                console.error(`Cleanup failed: ${cleanupError.message}`);
              }
              // Schedule additional cleanup after 5 seconds
              setTimeout(async () => {
                try {
                  if (await fsfs.promises.stat(tmpFile).catch(() => false)) {
                    await fs.promises.unlink(tmpFile);
                  }
                  if (await fs.promises.stat(outFile).catch(() => false)) {
                    await fs.promises.unlink(outFile);
                  }
                } catch (e) {
                  console.error(`Delayed cleanup failed: ${e.message}`);
                }
              }, 5000);
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    };

    // Convert audio to WhatsApp PTT (voice note)
    const toPTT = (buffer, ext) => {
      return ffmpeg(buffer, [
        '-vn', // No video
        '-c:a', 'libopus', // Use Opus codec
        '-b:a', '128k', // Bitrate
        '-ar', '48000', // Sample rate (WhatsApp-compatible)
        '-f', 'ogg' // Output format (Ogg container for Opus)
      ], ext, 'ogg');
    };

    try {
      // Validate m.sender
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        console.error(`Invalid m.sender: ${JSON.stringify(m.sender)}`);
        return m.reply(`◎━━━━━━━━━━━━━━━━◎\n│❒ Can’t read your number, genius! Try again.\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`);
      }

      // Validate toxicspeed
      if (typeof toxicspeed !== 'number' || isNaN(toxicspeed)) {
        console.error(`Invalid toxicspeed: ${toxicspeed}`);
        return m.reply(`◎━━━━━━━━━━━━━━━━◎\n│❒ Ping’s broken, @${m.sender.split('@')[0]}! Speed data’s fucked.\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`, { mentions: [m.sender] });
      }

      // Retrieve settings to get the current prefix
      const settings = await getSettings();
      if (!settings) {
        return m.reply(`◎━━━━━━━━━━━━━━━━◎\n│❒ Error: Couldn’t load settings, you dumb fuck.\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`);
      }

      const effectivePrefix = settings.prefix || ''; // Use empty string for prefixless mode

      const toFancyFont = (text, isUpperCase = false) => {
        const fonts = {
          'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
          'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
          'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
          'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
        };
        return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
          .split('')
          .map(char => fonts[char] || char)
          .join('');
      };

      // Uptime
      const formatUptime = (seconds) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const daysDisplay = days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}, ` : '';
        const hoursDisplay = hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}, ` : '';
        const minutesDisplay = minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, ` : '';
        const secsDisplay = secs > 0 ? `${secs} ${secs === 1 ? 'second' : 'seconds'}` : '';

        return (daysDisplay + hoursDisplay + minutesDisplay + secsDisplay).replace(/,\s*$/, '');
      };

      const userNumber = m.sender.split('@')[0];
      const pingTime = toxicspeed.toFixed(4);
      const uptimeText = formatUptime(process.uptime());
      const botName = 'Toxic-MD';
      const replyText = `
◎━━━━━━━━━━━━━━━━◎
│❒ *Pong, @${m.pushName}!* 🏓

│ ⏱️ *Response Time*: ${pingTime}ms

│ 🤖 *Bot Name*: ${toFancyFont(botName)}

│ ⏰ *Uptime*: ${uptimeText}

│ 🟢 *Status*: Active

I'm running like a damn beast! 😈

> Pσɯҽɾҽԃ Ⴆყ Toxic-MD
◎━━━━━━━━━━━━━━━━◎
      `;

      await client.sendMessage(m.chat, {
        text: replyText,
        mentions: [m.sender],
        contextInfo: {
          externalAdReply: {
            showAdAttribution: false,
            title: `${toFancyFont(botName)}`,
            body: `Yo, ${m.pushName}! Don’t waste my time.`,
            thumbnail: context.pict,
            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      // Download and convert the audio to PTT format
      const audioUrl = 'https://url.bwmxmd.online/Adams.93vw1nye.mp3';
      const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(response.responseData);
      const convertedAudio = await toPTT(audioBuffer, 'mp3');

      // Send the audio voice note after the text
      await client.sendMessage(m.chat, {
        audio: convertedAudio,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true // Displays as a voice note with waveform
      }, { quoted: m });

    } catch (error) {
      console.error(`Ping command fucked up: ${error.stack}`);
      await client.sendMessage(m.chat, {
        text: `◎━━━━━━━━━━━━━━━━◎\n│❒ Ping’s fucked, @${m.sender.split('@')[0]}! Try again, you slacker.\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};