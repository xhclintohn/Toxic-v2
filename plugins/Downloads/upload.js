const { uploadToUrl } = require('../../lib/toUrl');

module.exports = async (context) => {
    const { client, m } = context;

    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!mime) return m.reply("╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Quote or send a media file to upload.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

        const mediaBuffer = await q.download();

        if (mediaBuffer.length > 256 * 1024 * 1024) {
            return m.reply("╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ File too large! Max 256MB.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const ext = mime.split('/')[1] || 'bin';
        const link = await uploadToUrl(mediaBuffer, ext);
        const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        m.reply(
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ Uᴘʟᴏᴀᴅ Dᴏɴᴇ ≪───\n` +
            `├ \n` +
            `├ 🔗 *Link:* ${link}\n` +
            `├ 📁 *Size:* ${fileSizeMB} MB\n` +
            `╰──────────────────☉\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );

    } catch (err) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Uᴘʟᴏᴀᴅ Eʀʀᴏʀ ≪───\n├ \n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
