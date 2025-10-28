const fs = require("fs");
const path = require("path");

module.exports = async (context) => {
    const { client, m } = context;

    if (!m.quoted) {
        return m.reply("◈━━━━━━━━━━━━━━━━◈\n❒ Please reply to a *view-once* image or video.\n◈━━━━━━━━━━━━━━━━◈");
    }

    try {
        // Extract possible message layers
        const quoted = m.msg?.contextInfo?.quotedMessage;
        const viewOnce =
            quoted?.viewOnceMessageV2?.message ||
            quoted?.viewOnceMessageV2Extension?.message ||
            quoted;

        // Detect media
        const imageMessage = viewOnce?.imageMessage;
        const videoMessage = viewOnce?.videoMessage;

        if (!imageMessage && !videoMessage) {
            return m.reply("◈━━━━━━━━━━━━━━━━◈\n❒ This message doesn’t contain a *view-once* image or video.\n◈━━━━━━━━━━━━━━━━◈");
        }

        // Get caption if any
        const caption = imageMessage?.caption || videoMessage?.caption || "◈━━━━━━━━━━━━━━━━◈\n❒ Retrieved view-once media.\n◈━━━━━━━━━━━━━━━━◈";

        // File type + temp path
        const ext = videoMessage ? "mp4" : "jpg";
        const tempPath = path.join(__dirname, `temp_viewonce_${Date.now()}.${ext}`);

        // Download the actual media content
        await client.downloadAndSaveMediaMessage(imageMessage || videoMessage, tempPath);

        // Send media back
        if (imageMessage) {
            await client.sendMessage(
                m.chat,
                { image: fs.readFileSync(tempPath), caption },
                { quoted: m }
            );
        } else if (videoMessage) {
            await client.sendMessage(
                m.chat,
                { video: fs.readFileSync(tempPath), caption },
                { quoted: m }
            );
        }

        // Cleanup
        fs.unlinkSync(tempPath);
    } catch (error) {
        console.error("VVX Error:", error.message);
        await m.reply("◈━━━━━━━━━━━━━━━━◈\n❒ Failed to retrieve the view-once media.\n◈━━━━━━━━━━━━━━━━◈");
    }
};