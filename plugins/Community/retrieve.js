const fs = require('fs');

module.exports = async (context) => {
    const { client, m } = context;

    if (!m.quoted) return;

    try {
        const quoted = m.msg?.contextInfo?.quotedMessage || m.quoted || null;
        if (!quoted) return;

        const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessageV2Extension?.message || quoted?.viewOnceMessage || quoted;
        const imageMsg = viewOnce?.imageMessage || viewOnce?.imageMessageV2 || viewOnce?.imageMessageV1;
        const videoMsg = viewOnce?.videoMessage || viewOnce?.videoMessageV2 || viewOnce?.videoMessageV1;

        if (!imageMsg && !videoMsg) return;

        const buffer = await client.downloadMediaMessage(imageMsg || videoMsg);
        const botDM = client.user?.id;
        if (!buffer || !botDM) return;

        const caption = `╭───(    TOXIC-MD    )───\n├───≫ VIEW ONCE ≪───\n├ Sender: @${m.sender.split('@')[0]}\n├ Chat: ${m.isGroup ? 'Group' : 'DM'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (imageMsg) {
            await client.sendMessage(botDM, { image: buffer, caption });
        } else {
            await client.sendMessage(botDM, { video: buffer, caption });
        }
    } catch {}
};
