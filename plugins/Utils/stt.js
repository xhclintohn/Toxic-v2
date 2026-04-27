import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import axios from 'axios';
import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';
import FormData from 'form-data';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default {
    name: 'stt',
    aliases: ['speechtotext', 'transcribe', 'voicetotext'],
    description: 'Transcribes voice notes and audio messages to text',
    run: async (context) => {
        const { client, m, prefix } = context;
        const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

        let GROQ_API_KEY = '';
        try { const _k = await import('../../keys.js'); GROQ_API_KEY = _k.GROQ_API_KEY || ''; } catch {}
        if (!GROQ_API_KEY) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ GROQ_API_KEY not set in keys.js\n├ Add it to enable transcription.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const directAudio = m.message?.audioMessage;
        const quotedAudio = quoted?.audioMessage;
        const audioMsg = directAudio || quotedAudio;

        if (!audioMsg) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ Reply to a voice note or audio message,\n├ you muppet. I\'m not magic — I can\'t\n├ transcribe thin air.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        await client.sendMessage(m.chat, { react: { text: '👂', key: m.reactKey } });

        const tmpFile = path.join(os.tmpdir(), `stt_${Date.now()}.ogg`);

        try {
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await fsPromises.writeFile(tmpFile, buffer);

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
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
                return m.reply('╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ I listened to that rubbish and got\n├ absolutely nothing. Either you mumbled\n├ or you sent silence. Both are equally\n├ useless.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            }

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ 👂 *Transcription:*\n├ \n├ ${transcribed}\n├ \n├ _You're welcome. Now learn to type\n├ next time._\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        } catch (error) {
            console.error('STT error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ STT ≪───\n├ \n├ Transcription crashed. Whisper took one\n├ listen and gave up — honestly can't\n├ blame it.\n├ \n├ Error: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        } finally {
            fsPromises.unlink(tmpFile).catch(() => {});
        }
    }
};
