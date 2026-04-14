const { getSettings } = require('../../database/config');
const { uploadToUrl } = require('../../lib/toUrl');
const { makePhotoEdit } = require('../../lib/toxicApi');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'imgedit',
    aliases: ['photoedit', 'aiedit'],
    description: 'AI photo editor',
    category: 'Editing',
    run: async (context) => {
        const { client, m, prefix } = context;

        const settings = await getSettings();
        const effectivePrefix = settings.prefix || '.';

        let quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let imageMsg = null;

        if (m.message?.imageMessage) {
            imageMsg = m.message;
        } else if (quotedMsg?.imageMessage) {
            imageMsg = { message: quotedMsg, key: m.message?.extendedTextMessage?.contextInfo?.stanzaId };
        }

        const bodyText = m.body || '';
        const args = bodyText.slice(prefix.length).trim().split(/\s+/).slice(1);
        const prompt = args.join(' ').trim();

        if (!imageMsg) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Reply to an image with a prompt.\n├ Example: ${effectivePrefix}imgedit make it look like night\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧ᴛᴏɴ`);
        }

        if (!prompt) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Add a prompt.\n├ Example: ${effectivePrefix}imgedit make it look like night\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
        }

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        try {
            let imgBuf;
            
            if (m.message?.imageMessage) {
                imgBuf = await downloadMediaMessage(m, 'buffer', {});
            } else {
                const fakeMsg = {
                    key: m.key,
                    message: quotedMsg
                };
                imgBuf = await downloadMediaMessage(fakeMsg, 'buffer', {});
            }
            
            if (!imgBuf || imgBuf.length === 0) {
                throw new Error('No image data');
            }
            
            const imgLink = await uploadToUrl(imgBuf);
            const resultUrl = await makePhotoEdit(imgLink, prompt);

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await client.sendMessage(m.chat, {
                image: { url: resultUrl },
                caption: `╭───(    TOXIC-MD    )───\n├───≫ Dᴏɴᴇ ≪───\n├ \n├ Here's your edited image.\n├ Prompt: ${prompt}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_ᴄʟɪɴᴛᴏɴ`
            }, { quoted: m });

        } catch (error) {
            console.error('imgedit error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ AI edit failed. Try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰ᴇʀᴇᴅ 𝐁ʏ 𝐱ʜ_ᴄʟɪɴᴛᴏɴ`);
        }
    }
};