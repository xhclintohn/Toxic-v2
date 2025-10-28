const fs = require("fs");
const path = require("path");

module.exports = async (context) => {
    const { client, m } = context;

    if (!m.quoted) {
        return m.reply("◈━━━━━━━━━━━━━━━━◈\n❒ Please reply to a *view-once* image or video.\n◈━━━━━━━━━━━━━━━━◈");
    }

    const quotedMessage = m.msg?.contextInfo?.quotedMessage;

    try {
        // Check for view-once message types
        const viewOnceImage = quotedMessage?.viewOnceMessageV2?.message?.imageMessage;
        const viewOnceVideo = quotedMessage?.viewOnceMessageV2?.message?.videoMessage;

        if (!viewOnceImage && !viewOnceVideo) {
            return m.reply("◈━━━━━━━━━━━━━━━━◈\n❒ This message doesn’t contain a *view-once* image or video.\n◈━━━━━━━━━━━━━━━━◈");
        }

        // Choose which media to extract
        const mediaMessage = viewOnceImage || viewOnceVideo;
        const caption = mediaMessage?.caption || "◈━━━━━━━━━━━━━━━━◈\n❒ Retrieved view-once media.\n◈━━━━━━━━━━━━━━━━◈";

        // Temporary file for saving
        const ext = viewOnceVideo ? "mp4" : "jpg";
        const tempPath = path.join(__dirname, `temp_viewonce_${Date.now()}.${ext}`);

        // Download the media file
        await client.downloadAndSaveMediaMessage(mediaMessage, tempPath);

        // Send the media back with caption
        if (viewOnceImage) {
            await client.sendMessage(
                m.chat,
                {
                    image: fs.readFileSync(tempPath),
                    caption,
                },
                { quoted: m }
            );
        } else if (viewOnceVideo) {
            await client.sendMessage(
                m.chat,
                {
                    video: fs.readFileSync(tempPath),
                    caption,
                },
                { quoted: m }
            );
        }

        // Delete temp file
        fs.unlinkSync(tempPath);
    } catch (error) {
        console.error("VVX Error:", error.message);
        await m.reply("◈━━━━━━━━━━━━━━━━◈\n❒ Failed to retrieve the view-once media.\n◈━━━━━━━━━━━━━━━━◈");
    }
};