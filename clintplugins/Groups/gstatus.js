const fs = require("fs");
const path = require("path");

module.exports = async (context) => {
    const { client, m, text } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

    // Helper: Check if chat is a group
    const isGroup = await client.isGroup(m.chat);
    if (!isGroup) {
        return m.reply(formatStylishReply("This only works in groups, fam! Join one and try again. 📢"));
    }

    // Optional caption from text
    const caption = text || null;

    try {
        let mediaBuffer;
        let mimeType = "image/jpeg"; // Default

        // If quoted message exists and has media (image/video)
        if (m.quoted && m.quoted.mtype && (m.quoted.mtype === "imageMessage" || m.quoted.mtype === "videoMessage")) {
            // Download the quoted media
            const quotedDownload = await m.quoted.download();
            mediaBuffer = quotedDownload;
            mimeType = m.quoted.mtype === "videoMessage" ? "video/mp4" : "image/jpeg";
        } else {
            // Fallback: If no quoted media, prompt for one
            return m.reply(formatStylishReply("Reply to an image or video to set as group status, bruh! 📸 Ex: Reply to img + .gstatus [optional caption]"));
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            return m.reply(formatStylishReply("Couldn't grab that media, fam. Make sure it's an image/video. 😩"));
        }

        // Send as Group Story (status visible to group for 24h)
        const storyOptions = {
            [mimeType === "videoMessage" ? "video" : "image"]: mediaBuffer,
            caption: caption, // Optional text overlay/caption
            mimetype: mimeType
        };

        await client.sendGroupStory(m.chat, storyOptions);

        // Success reply
        const mediaType = mimeType === "videoMessage" ? "Video" : "Image";
        await m.reply(formatStylishReply(`Boom! Sent ${mediaType} as group status. It'll vanish in 24h. 🔥📱\nCaption: ${caption || "None"}`));

    } catch (error) {
        console.error("Group Story send error:", error);
        m.reply(formatStylishReply(`Hit a snag: ${error.message}. Check perms or update your bot. 😎`));
    }
};