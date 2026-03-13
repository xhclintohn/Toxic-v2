const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m } = context;

    if (!m.quoted) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Reply to a view-once image or video.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    try {
        const quoted = m.msg?.contextInfo?.quotedMessage || m.quoted || null;
        if (!quoted) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Could not find the quoted message.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessageV2Extension?.message || quoted?.viewOnceMessage || quoted;
        const imageMsg = viewOnce?.imageMessage || viewOnce?.imageMessageV2 || viewOnce?.imageMessageV1;
        const videoMsg = viewOnce?.videoMessage || viewOnce?.videoMessageV2 || viewOnce?.videoMessageV1;

        if (!imageMsg && !videoMsg) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ This message does not contain\n├ view-once media.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const mediaMessage = imageMsg || videoMsg;
        const returnedPath = await client.downloadAndSaveMediaMessage(mediaMessage);
        if (!returnedPath || !fs.existsSync(returnedPath)) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Failed to download media.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const buffer = fs.readFileSync(returnedPath);
        const chatId = m.chat || client.user?.id;
        
        const caption = `╭───(    TOXIC-MD    )───\n├───≫ VIEW ONCE ≪───\n├ \n├ Here's your media, perv.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (imageMsg) {
            await client.sendMessage(chatId, { image: buffer, caption }, { quoted: m });
        } else {
            await client.sendMessage(chatId, { video: buffer, caption }, { quoted: m });
        }

        try {
            fs.unlinkSync(returnedPath);
        } catch (e) {}
    } catch (error) {
        console.error('VVX Error:', error);
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to retrieve view-once media.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
