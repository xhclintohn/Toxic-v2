const { getFakeQuoted } = require('../../lib/fakeQuoted');
module.exports = async (context) => {

  const { client, m, text } = context;
  const fq = getFakeQuoted(m);

  const googleTTS = require('google-tts-api');

  if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TTS ≪───\n├ \n├ Where is the text for conversion?\n├ Can\'t you read instructions?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

  await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

  try {
    const url = googleTTS.getAudioUrl(text, {
      lang: 'hi-IN',
      slow: false,
      host: 'https://translate.google.com',
    });

    await client.sendMessage(m.chat, { audio: { url:url},mimetype:'audio/mp4', ptt: true }, { quoted: fq });
    await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
  } catch (e) {
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    m.reply('╭───(    TOXIC-MD    )───\n├───≫ TTS ERROR ≪───\n├ \n├ TTS failed. Try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
  }

  }