const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
  const { client, m } = context;
  const fq = getFakeQuoted(m);
  const quoted = m.quoted || m;
  const mime = (quoted.msg || quoted).mimetype || '';

  if (!/audio|video/.test(mime)) {
    return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Send or reply to an audio/video file with the caption _transcribe_ idiot\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }

  await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

  try {
    const buffer = await m.quoted.download();

    if (buffer.length > 5 * 1024 * 1024) {
      return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Maximum file size is 5 MB.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    const result = await transcribeWithTalknotes(buffer);

    if (!result || !result.text) {
      return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ \n├ Failed to extract text. Please try again later.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Tʀᴀɴsᴄʀɪᴘᴛɪᴏɴ ≪───\n├ \n├ ${result.text}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  } catch (error) {
    console.error(error);
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ An error occurred while processing the file.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
};

function generateToken(secretKey) {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(timestamp);
  const token = hmac.digest('hex');

  return {
    'x-timestamp': timestamp,
    'x-token': token
  };
}

async function transcribeWithTalknotes(buffer) {
  try {
    const form = new FormData();
    form.append('file', buffer, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    });

    const tokenData = generateToken('w0erw90wr3rnhwoi3rwe98sdfihqio432033we8rhoeiw');

    const headers = {
      ...form.getHeaders(),
      ...tokenData,
      'referer': 'https://talknotes.io/',
      'origin': 'https://talknotes.io',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
    };

    const { data } = await axios.post('https://api.talknotes.io/tools/converter', form, { headers });

    return data;
  } catch (err) {
    console.error('Talknotes error:', err.message);
    return null;
  }
}