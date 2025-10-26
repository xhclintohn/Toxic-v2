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
            { text: formatStylishReply("Solo chat? Get lost, moron! This is for GROUPS only! 😡") },
            { quoted: m }
        );
    }

    // Check if bot is group admin
    if (!isBotAdmin) {
        return client.sendMessage(
            m.chat,
            { text: formatStylishReply("I’m not your lackey! Make me a GROUP ADMIN to post stories, you pathetic fool! 😈") },
            { quoted: m }
        );
    }

    // Optional caption or text status
    const caption = text ? text.trim() : null;

    try {
        let mediaBuffer;
        let contentType = null;
        let mimeType = null;

        // Check for quoted message
        const quoted = m.quoted || m;
        const mime = (quoted.msg || quoted).mimetype || "";

        // Handle nested messages (ephemeral, view-once)
        let quotedMessage = quoted;
        if (quoted.mtype === "ephemeralMessage" || quoted.mtype === "viewOnceMessage") {
            quotedMessage = quoted.message[Object.keys(quoted.message)[0]];
        }

        // Check media type or text
        if (/image/.test(mime) || quotedMessage.mtype === "imageMessage") {
            mediaBuffer = await client.downloadMediaMessage(quoted);
            contentType = "image";
            mimeType = "image/jpeg";
        } else if (/video/.test(mime) || quotedMessage.mtype === "videoMessage") {
            mediaBuffer = await client.downloadMediaMessage(quoted);
            contentType = "video";
            mimeType = "video/mp4";
        } else if (/audio/.test(mime) || quotedMessage.mtype === "audioMessage") {
            mediaBuffer = await client.downloadMediaMessage(quoted);
            contentType = "audio";
            mimeType = "audio/mpeg";
        } else if (caption && !m.quoted) {
            // Text-only status
            await client.sendGroupStory(m.chat, { text: caption });
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply(`Smashed that text status into the group! It’s live for 24h, don’t cry when it’s gone! 🔥📱\nText: ${caption}`) },
                { quoted: m }
            );
        } else {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("No media? You brain-dead twit! REPLY to an image, video, or audio, or send text, you useless dimwit! 😤 Ex: .gstatus [text] or reply + .gstatus") },
                { quoted: m }
            );
        }

        if (mediaBuffer && mediaBuffer.length === 0) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("Media’s busted, you idiot! Send something that actually works! 😩") },
                { quoted: m }
            );
        }

        // Validate media size
        const maxSize = contentType === "video" ? 16 * 1024 * 1024 : contentType === "image" ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // Audio ~10MB
        if (mediaBuffer && mediaBuffer.length > maxSize) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply(`You tryna crash me with this massive junk? Max size: ${contentType === "video" ? "16MB" : contentType === "image" ? "5MB" : "10MB"}, you clueless moron! 📉`) },
                { quoted: m }
            );
        }

        // Send as Group Story
        const storyOptions = {
            [contentType]: mediaBuffer,
            caption: caption,
            mimetype: mimeType
        };

        await client.sendGroupStory(m.chat, storyOptions);

        // Success
        const mediaType = contentType.charAt(0).toUpperCase() + contentType.slice(1);
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`Crushed it! That ${mediaType} is now group status! Gone in 24h, so don’t whine, weakling! 🔥📱\nCaption: ${caption || "None"}`) },
            { quoted: m }
        );

        // React with ✅
        await m.react("✅");

    } catch (error) {
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`You broke it, you absolute dunce! Error: ${error.message}. Fix your media or make me admin! 😎`) },
            { quoted: m }
        );
    }
};