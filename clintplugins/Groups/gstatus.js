const fs = require("fs");
const path = require("path");

module.exports = async (context) => {
    const { client, m, text, isBotAdmin } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

    // Check if chat is a group
    if (!m.isGroup) {
        return client.sendMessage(
            m.chat,
            { text: formatStylishReply("This only works in groups, fam! Join one and try again. 📢") },
            { quoted: m }
        );
    }

    // Check if bot is group admin (required for group stories)
    if (!isBotAdmin) {
        return client.sendMessage(
            m.chat,
            { text: formatStylishReply("Yo, I need to be a group admin to post stories! Promote me, fam. 😎") },
            { quoted: m }
        );
    }

    // Optional caption from text
    const caption = text ? text.trim() : null;

    try {
        let mediaBuffer;
        let isVideo = false;
        let mimeType = "image/jpeg"; // Default

        // If quoted message exists and has media (image/video)
        if (m.quoted && (m.quoted.imageMessage || m.quoted.videoMessage)) {
            // Download the quoted media using client.downloadMediaMessage
            mediaBuffer = await client.downloadMediaMessage(m.quoted);
            isVideo = !!m.quoted.videoMessage;
            mimeType = isVideo ? "video/mp4" : "image/jpeg";
        } else {
            // Prompt for quoted media
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("Reply to an image or video to set as group status, bruh! 📸 Ex: Reply to img + .gstatus [optional caption]") },
                { quoted: m }
            );
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("Couldn't grab that media, fam. Make sure it's an image/video. 😩") },
                { quoted: m }
            );
        }

        // Validate media size (WhatsApp limits: ~5MB image, ~16MB/30s video)
        const maxSize = isVideo ? 16 * 1024 * 1024 : 5 * 1024 * 1024; // Bytes
        if (mediaBuffer.length > maxSize) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply(`Media too big, fam! Max size: ${isVideo ? "16MB" : "5MB"}. Try a smaller file. 📉`) },
                { quoted: m }
            );
        }

        // Send as Group Story
        const storyOptions = {
            [isVideo ? "video" : "image"]: mediaBuffer,
            caption: caption,
            mimetype: mimeType
        };

        await client.sendGroupStory(m.chat, storyOptions);

        // Success reply
        const mediaType = isVideo ? "Video" : "Image";
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`Boom! Sent ${mediaType} as group status. It'll vanish in 24h. 🔥📱\nCaption: ${caption || "None"}`) },
            { quoted: m }
        );

    } catch (error) {
        console.error("Group Story send error:", error);
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`Hit a snag: ${error.message}. Check perms (bot needs admin) or update Baileys. 😎`) },
            { quoted: m }
        );
    }
};