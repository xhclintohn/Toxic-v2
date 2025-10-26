const fs = require("fs");
const path = require("path");

module.exports = async (context) => {
    const { client, m, text, isBotAdmin } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

   
    if (!m.isGroup) {
        return client.sendMessage(
            m.chat,
            { text: formatStylishReply("Solo chat? You’re wasting my time, moron! Use this in a GROUP! 😡") },
            { quoted: m }
        );
    }

    
    if (!isBotAdmin) {
        return client.sendMessage(
            m.chat,
            { text: formatStylishReply("I ain’t your servant! Make me a GROUP ADMIN to post stories, dumbass! 😈") },
            { quoted: m }
        );
    }

    
    const caption = text ? text.trim() : null;

    try {
        let mediaBuffer;
        let isVideo = false;
        let mimeType = "image/jpeg";

        
        if (!m.quoted) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("No quoted media? You blind or just stupid? REPLY to an image or video, fool! 😤 Ex: .gstatus [caption]") },
                { quoted: m }
            );
        }

        
        let quotedMessage = m.quoted;
        if (quotedMessage.mtype === "ephemeralMessage" || quotedMessage.mtype === "viewOnceMessage") {
            quotedMessage = quotedMessage.message[Object.keys(quotedMessage.message)[0]];
        }

       
        if (quotedMessage.mtype === "imageMessage" || quotedMessage.mtype === "videoMessage") {
            mediaBuffer = await client.downloadMediaMessage(m.quoted);
            isVideo = quotedMessage.mtype === "videoMessage";
            mimeType = isVideo ? "video/mp4" : "image/jpeg";
        } else if (quotedMessage.mtype === "stickerMessage" && !quotedMessage.isAnimated) {
            
            mediaBuffer = await client.downloadMediaMessage(m.quoted);
            mimeType = "image/webp";
        } else {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("What’s this trash? That’s not an image or video! Reply to ACTUAL media, you clueless twit! 😣") },
                { quoted: m }
            );
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("Media’s busted, idiot! Send a working image or video next time! 😩") },
                { quoted: m }
            );
        }

        
        const maxSize = isVideo ? 16 * 1024 * 1024 : 5 * 1024 * 1024; 
        if (mediaBuffer.length > maxSize) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply(`You tryna nuke the server with this huge file? Max size: ${isVideo ? "16MB" : "5MB"}, dimwit! Shrink it! 📉`) },
                { quoted: m }
            );
        }

        
        const storyOptions = {
            [isVideo ? "video" : "image"]: mediaBuffer,
            caption: caption,
            mimetype: mimeType
        };

        await client.sendGroupStory(m.chat, storyOptions);

       
        const mediaType = isVideo ? "Video" : quotedMessage.mtype === "stickerMessage" ? "Sticker" : "Image";
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`Smashed that ${mediaType} into the group status! It’s live for 24h, so don’t whine when it’s gone! 🔥📱\nCaption: ${caption || "None"}`) },
            { quoted: m }
        );

    } catch (error) {
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`You screwed up big time! Error: ${error.message}. Fix your media or make me admin, you slacker! 😎`) },
            { quoted: m }
        );
    }
};