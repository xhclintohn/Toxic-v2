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
            { text: formatStylishReply("What’s this solo crap? This command’s for GROUPS only, moron! Join one and stop wasting my time! 😡") },
            { quoted: m }
        );
    }

    // Check if bot is group admin (required for group stories)
    if (!isBotAdmin) {
        return client.sendMessage(
            m.chat,
            { text: formatStylishReply("Yo, you think I’m some peasant? I need ADMIN rights to post group stories, dumbass! Promote me NOW! 😈") },
            { quoted: m }
        );
    }

    // Optional caption from text
    const caption = text ? text.trim() : null;

    try {
        let mediaBuffer;
        let isVideo = false;
        let mimeType = "image/jpeg"; // Default

        // Debug: Log quoted message structure
        console.log("gstatus.js: Quoted message structure:", JSON.stringify(m.quoted || {}, null, 2));

        // Check for quoted message and media
        if (!m.quoted) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("No quoted message? Are you brain-dead? REPLY to an image or video, idiot! Ex: Reply + .gstatus [caption] 🖕") },
                { quoted: m }
            );
        }

        // Handle quoted media (image, video, or nested messages)
        let quotedMessage = m.quoted;
        // Check for nested messages (ephemeral, viewOnce, etc.)
        if (quotedMessage.mtype === "ephemeralMessage" || quotedMessage.mtype === "viewOnceMessage") {
            quotedMessage = quotedMessage.message[Object.keys(quotedMessage.message)[0]];
        }

        // Check media type
        if (quotedMessage.mtype === "imageMessage" || quotedMessage.mtype === "videoMessage") {
            mediaBuffer = await client.downloadMediaMessage(m.quoted);
            isVideo = quotedMessage.mtype === "videoMessage";
            mimeType = isVideo ? "video/mp4" : "image/jpeg";
        } else {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply(`What’s this garbage? You call THAT media? Reply to an actual IMAGE or VIDEO, you clueless twit! 😤 Ex: .gstatus [caption]`) },
                { quoted: m }
            );
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("Media’s borked or empty, you fool! Send a proper image or video that actually works! 😣") },
                { quoted: m }
            );
        }

        // Validate media size (WhatsApp limits: ~5MB image, ~16MB/30s video)
        const maxSize = isVideo ? 16 * 1024 * 1024 : 5 * 1024 * 1024; // Bytes
        if (mediaBuffer.length > maxSize) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply(`You trying to crash me with this massive file? Max size: ${isVideo ? "16MB" : "5MB"}, you numbskull! Shrink it! 📉`) },
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
            { text: formatStylishReply(`Hell yeah! Slammed that ${mediaType} into the group status! It’s live for 24h, so don’t cry when it vanishes! 🔥📱\nCaption: ${caption || "None"}`) },
            { quoted: m }
        );

    } catch (error) {
        console.error("Group Story send error:", error);
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`You broke something, genius! Error: ${error.message}. Check admin perms or update Baileys, you slacker! 😎`) },
            { quoted: m }
        );
    }
};