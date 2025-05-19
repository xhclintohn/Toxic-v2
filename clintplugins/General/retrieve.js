module.exports = async (context) => {
    const { client, m } = context;

    if (!m.quoted) {
        return;
    }

    const quotedMessage = m.msg?.contextInfo?.quotedMessage;

    try {
        if (quotedMessage.imageMessage) {
            let imageUrl = await client.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
            await client.sendMessage(m.chat, { image: { url: imageUrl } }, { quoted: m });
        }
    } catch (error) {
        console.error("Error in view-once command:", error.message);
    }
};