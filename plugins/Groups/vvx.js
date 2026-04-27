import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    const { client, m } = context;
    const fq = getFakeQuoted(m);
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

    if (!m.quoted) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Reply to a view-once image or video.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    try {
        const quoted = m.msg?.contextInfo?.quotedMessage || null;
        const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessageV2Extension?.message || quoted?.viewOnceMessage || quoted;
        const imageMsg = viewOnce?.imageMessage || viewOnce?.imageMessageV2 || viewOnce?.imageMessageV1;
        const videoMsg = viewOnce?.videoMessage || viewOnce?.videoMessageV2 || viewOnce?.videoMessageV1;
        const mediaMessage = imageMsg || videoMsg;

        if (!mediaMessage) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ This message does not contain\n├ view-once media.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const buffer = await client.downloadMediaMessage(mediaMessage);
        if (!buffer || buffer.length === 0) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Failed to download media.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const dest = m.chat;
        const caption = `╭───(    TOXIC-MD    )───\n├───≫ VIEW ONCE ≪───\n├ \n├ Here's your media, perv.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (imageMsg) {
            await client.sendMessage(dest, { image: buffer, caption });
        } else {
            await client.sendMessage(dest, { video: buffer, caption });
        }
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
    } catch (error) {
        console.error('VVX Error:', error);
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to retrieve view-once media.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
