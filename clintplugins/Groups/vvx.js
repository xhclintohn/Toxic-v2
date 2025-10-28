const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m } = context;

    if (!m.quoted) {
        if (m.reply) return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Reply to a view-once image or video.\n◈━━━━━━━━━━━━━━━━◈');
        return;
    }

    try {
        // Reliable chat id resolution (group or DM)
        const chatId =
            m.chat ||
            m.key?.remoteJid ||
            m.msg?.key?.remoteJid ||
            (m.msg?.contextInfo && m.msg.contextInfo.remoteJid) ||
            client.user?.id;

        // Extract quoted message object
        const quoted = m.msg?.contextInfo?.quotedMessage || m.quoted || null;
        if (!quoted) {
            return m.reply && m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Could not find the quoted message.\n◈━━━━━━━━━━━━━━━━◈');
        }

        // Try various wrappers for view-once
        const viewOnce =
            quoted?.viewOnceMessageV2?.message ||
            quoted?.viewOnceMessageV2Extension?.message ||
            quoted?.viewOnceMessage ||
            quoted;

        // Try common media property names
        const imageMsg = viewOnce?.imageMessage || viewOnce?.imageMessageV2 || viewOnce?.imageMessageV1;
        const videoMsg = viewOnce?.videoMessage || viewOnce?.videoMessageV2 || viewOnce?.videoMessageV1;

        if (!imageMsg && !videoMsg) {
            return m.reply && m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ This message doesn’t contain a view-once image or video.\n◈━━━━━━━━━━━━━━━━◈');
        }

        // Use the media object we will download
        const mediaMessage = imageMsg || videoMsg;

        // Preserve caption if available (check a few places)
        const caption =
            mediaMessage?.caption ||
            viewOnce?.caption ||
            quoted?.caption ||
            quoted?.text ||
            'Retrieved by Toxic-MD';

        // Download the media to a temp file (Baileys helper returns path)
        const returnedPath = await client.downloadAndSaveMediaMessage(mediaMessage);

        // Ensure file exists
        if (!returnedPath || !fs.existsSync(returnedPath)) {
            return m.reply && m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Failed to download media.\n◈━━━━━━━━━━━━━━━━◈');
        }

        // Read file buffer
        const buffer = fs.readFileSync(returnedPath);

        // Send to the resolved chatId (same chat where command used)
        if (imageMsg) {
            await client.sendMessage(
                chatId,
                { image: buffer, caption },
                { quoted: m }
            );
        } else {
            // video
            await client.sendMessage(
                chatId,
                { video: buffer, caption },
                { quoted: m }
            );
        }

        // Cleanup temp file
        try {
            fs.unlinkSync(returnedPath);
        } catch (e) {
            // ignore cleanup errors
        }
    } catch (error) {
        console.error('VVX Error:', error);
        if (m.reply) m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Failed to retrieve the view-once media.\n◈━━━━━━━━━━━━━━━━◈');
    }
};