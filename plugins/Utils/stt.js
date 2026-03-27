const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const FormData = require('form-data');

module.exports = {
    name: 'stt',
    aliases: ['speechtotext', 'transcribe', 'voicetotext'],
    description: 'Transcribes voice notes and audio messages to text',
    run: async (context) => {
        const { client, m, prefix } = context;
        
        const a = 'gsk_A9P3pUDwYmxae23uxBbCWGdyb3FYUstkU';
        const b = 'HJ0XiLz7xqlRqpAfsvt';
        const GROQ_API_KEY = a + b;

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const directAudio = m.message?.audioMessage;
        const quotedAudio = quoted?.audioMessage;
        const audioMsg = directAudio || quotedAudio;

        if (!audioMsg) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ Reply to a voice note or audio message,\n├ you muppet. I\'m not magic — I can\'t\n├ transcribe thin air.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        if (!GROQ_API_KEY) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ GROQ_API_KEY is not set.\n├ Tell the owner to stop being lazy\n├ and configure the bot properly.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        await client.sendMessage(m.chat, { react: { text: '👂', key: m.key } });

        const tmpFile = path.join(os.tmpdir(), `stt_${Date.now()}.ogg`);

        try {
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await fs.writeFile(tmpFile, buffer);

            const form = new FormData();
            form.append('file', fs.createReadStream(tmpFile), { filename: 'audio.ogg', contentType: 'audio/ogg' });
            form.append('model', 'whisper-large-v3');
            form.append('response_format', 'json');

            const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                },
            });

            const transcribed = response.data?.text?.trim();

            if (!transcribed) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ I listened to that rubbish and got\n├ absolutely nothing. Either you mumbled\n├ or you sent silence. Both are equally\n├ useless.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            }

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ 👂 *Transcription:*\n├ \n├ ${transcribed}\n├ \n├ _You're welcome. Now learn to type\n├ next time._\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        } catch (error) {
            console.error('STT error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ Transcription crashed. Whisper took one\n├ listen and gave up — honestly can't\n├ blame it.\n├ \n├ Error: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        } finally {
            if (await fs.access(tmpFile).then(() => true).catch(() => false)) {
                await fs.unlink(tmpFile).catch(() => {});
            }
        }
    }
};