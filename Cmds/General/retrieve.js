module.exports = async (context) => {
    const { client, m } = context;

    // Function to format stylish reply
    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
    };

    if (!m.quoted) {
        return m.reply(formatStylishReply("Yo, you need to quote a view-once message first! 😎 Try again."));
    }

    const quotedMessage = m.msg?.contextInfo?.quotedMessage;

    try {
        if (quotedMessage.imageMessage) {
            let imageCaption = quotedMessage.imageMessage.caption || "Here's that view-once image! 🖼️";
            let imageUrl = await client.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
            await m.reply(formatStylishReply("Got it! Sending the image now..."));
            await client.sendMessage(m.chat, { image: { url: imageUrl }, caption: imageCaption }, { quoted: m });
        } else if (quotedMessage.videoMessage) {
            let videoCaption = quotedMessage.videoMessage.caption || "Here's that view-once video! 🎥";
            let videoUrl = await client.downloadAndSaveMediaMessage(quotedMessage.videoMessage);
            await m.reply(formatStylishReply("Hold up, grabbing that video for you..."));
            await client.sendMessage(m.chat, { video: { url: videoUrl }, caption: videoCaption }, { quoted: m });
        } else {
            return m.reply(formatStylishReply("Hmm, that quoted message isn't a view-once image or video. 😕 Quote something else?"));
        }
    } catch (error) {
        console.error("Error in view-once command:", error.message);
        return m.reply(formatStylishReply(`Oops, something went wrong: ${error.message} 😢 Try another message?`));
    }
};