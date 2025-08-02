const { loadChatData, saveChatData } = require("../lib/Store");

module.exports = async (client, m, store, pict) => {
    try {
        const settings = await require('../Database/config').getSettings();
        if (!settings || !settings.antidelete || !m.message || m.key.fromMe) {
            console.log(`Toxic-MD Antidelete: Skipped - antidelete=${settings?.antidelete}, fromMe=${m.key?.fromMe}`);
            return;
        }

        const botNumber = await client.decodeJid(client.user.id);
        const remoteJid = m.key.remoteJid;
        const messageId = m.key.id;
        const participant = m.key.participant || remoteJid;

        if (participant === botNumber) {
            console.log(`Toxic-MD Antidelete: Skipped - Message from bot itself`);
            return;
        }

        // Handle incoming message (store it)
        if (!m.message.protocolMessage) {
            console.log(`Toxic-MD Antidelete: Storing message - remoteJid=${remoteJid}, messageId=${messageId}`);
            saveChatData(remoteJid, messageId, [m]);
            return;
        }

        // Handle revocation (protocolMessage)
        if (m.message.protocolMessage?.key) {
            console.log(`Toxic-MD Antidelete: Processing revocation - remoteJid=${remoteJid}, messageId=${m.message.protocolMessage.key.id}`);
            const originalMessageId = m.message.protocolMessage.key.id;
            const chatData = loadChatData(remoteJid, originalMessageId);
            const originalMessage = chatData[0];

            if (!originalMessage) {
                console.log(`Toxic-MD Antidelete: No original message found for messageId=${originalMessageId}`);
                return;
            }

            const deletedBy = participant;
            const sentBy = originalMessage.key.participant || originalMessage.key.remoteJid;
            const deletedByFormatted = `@${deletedBy.split('@')[0]}`;
            const sentByFormatted = `@${sentBy.split('@')[0]}`;

            let notificationText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *DELETED MESSAGE DETECTED* 🥀\n│❒ *Deleted by*: ${deletedByFormatted}\n│❒ *Sent by*: ${sentByFormatted}\n┗━━━━━━━━━━━━━━━┛`;

            try {
                if (originalMessage.message?.conversation) {
                    // Text message
                    const messageText = originalMessage.message.conversation;
                    notificationText += `\n│❒ *Message*: ${messageText}`;
                    await client.sendMessage(botNumber, { text: notificationText });
                } else if (originalMessage.message?.extendedTextMessage) {
                    // Extended text message
                    const messageText = originalMessage.message.extendedTextMessage.text;
                    notificationText += `\n│❒ *Message*: ${messageText}`;
                    await client.sendMessage(botNumber, { text: notificationText });
                } else if (originalMessage.message?.imageMessage) {
                    // Image message
                    notificationText += `\n│❒ *Media*: [Image]`;
                    try {
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        await client.sendMessage(botNumber, {
                            image: buffer,
                            caption: `${notificationText}\n│❒ *Caption*: ${originalMessage.message.imageMessage.caption || 'None'}`,
                            contextInfo: {
                                externalAdReply: {
                                    title: "Toxic-MD Antidelete",
                                    body: `DELETED BY: ${deletedByFormatted}`,
                                    thumbnail: pict,
                                    sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                    } catch (mediaError) {
                        console.error('Toxic-MD Antidelete: Failed to download image:', mediaError);
                        notificationText += `\n│❒ *Error*: Could not recover deleted image (media expired)`;
                        await client.sendMessage(botNumber, { text: notificationText });
                    }
                } else if (originalMessage.message?.videoMessage) {
                    // Video message
                    notificationText += `\n│❒ *Media*: [Video]`;
                    try {
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        await client.sendMessage(botNumber, {
                            video: buffer,
                            caption: `${notificationText}\n│❒ *Caption*: ${originalMessage.message.videoMessage.caption || 'None'}`,
                            contextInfo: {
                                externalAdReply: {
                                    title: "Toxic-MD Antidelete",
                                    body: `DELETED BY: ${deletedByFormatted}`,
                                    thumbnail: pict,
                                    sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                    } catch (mediaError) {
                        console.error('Toxic-MD Antidelete: Failed to download video:', mediaError);
                        notificationText += `\n│❒ *Error*: Could not recover deleted video (media expired)`;
                        await client.sendMessage(botNumber, { text: notificationText });
                    }
                } else if (originalMessage.message?.stickerMessage) {
                    // Sticker message
                    notificationText += `\n│❒ *Media*: [Sticker]`;
                    try {
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        await client.sendMessage(botNumber, {
                            sticker: buffer,
                            contextInfo: {
                                externalAdReply: {
                                    title: "Toxic-MD Antidelete",
                                    body: `DELETED BY: ${deletedByFormatted}`,
                                    thumbnail: pict,
                                    sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                    } catch (mediaError) {
                        console.error('Toxic-MD Antidelete: Failed to download sticker:', mediaError);
                        notificationText += `\n│❒ *Error*: Could not recover deleted sticker (media expired)`;
                        await client.sendMessage(botNumber, { text: notificationText });
                    }
                } else if (originalMessage.message?.documentMessage) {
                    // Document message
                    notificationText += `\n│❒ *Media*: [Document]`;
                    try {
                        const docMessage = originalMessage.message.documentMessage;
                        const fileName = docMessage.fileName || `document_${Date.now()}.dat`;
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        if (!buffer) {
                            console.log('Toxic-MD Antidelete: Download failed - empty buffer');
                            notificationText += `\n│❒ *Error*: Download failed`;
                            await client.sendMessage(botNumber, { text: notificationText });
                            return;
                        }
                        await client.sendMessage(botNumber, {
                            document: buffer,
                            fileName: fileName,
                            mimetype: docMessage.mimetype || 'application/octet-stream',
                            contextInfo: {
                                externalAdReply: {
                                    title: "Toxic-MD Antidelete",
                                    body: `DELETED BY: ${deletedByFormatted}`,
                                    thumbnail: pict,
                                    sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                    } catch (mediaError) {
                        console.error('Toxic-MD Antidelete: Failed to download document:', mediaError);
                        notificationText += `\n│❒ *Error*: Could not recover deleted document (media expired)`;
                        await client.sendMessage(botNumber, { text: notificationText });
                    }
                } else if (originalMessage.message?.audioMessage) {
                    // Audio message
                    notificationText += `\n│❒ *Media*: [Audio]`;
                    try {
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        const isPTT = originalMessage.message.audioMessage.ptt === true;
                        await client.sendMessage(botNumber, {
                            audio: buffer,
                            ptt: isPTT,
                            mimetype: 'audio/mpeg',
                            contextInfo: {
                                externalAdReply: {
                                    title: "Toxic-MD Antidelete",
                                    body: `DELETED BY: ${deletedByFormatted}`,
                                    thumbnail: pict,
                                    sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                    } catch (mediaError) {
                        console.error('Toxic-MD Antidelete: Failed to download audio:', mediaError);
                        notificationText += `\n│❒ *Error*: Could not recover deleted audio (media expired)`;
                        await client.sendMessage(botNumber, { text: notificationText });
                    }
                } else {
                    // Unsupported message type
                    notificationText += `\n│❒ *Error*: Unsupported message type`;
                    await client.sendMessage(botNumber, { text: notificationText });
                }
            } catch (error) {
                console.error('Toxic-MD Antidelete Error:', error);
                notificationText += `\n│❒ *Error*: Failed to recover deleted content 😓`;
                await client.sendMessage(botNumber, { text: notificationText });
            }
        }
    } catch (e) {
        console.error("Toxic-MD Antidelete Error:", e);
    }
};