const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../message_data');

// Create base directory if it doesn't exist
if (!fs.existsSync(baseDir)) {
    try {
        fs.mkdirSync(baseDir, { recursive: true });
        console.log('Toxic-MD Store: Created /app/message_data directory');
    } catch (e) {
        console.error('Toxic-MD Store Error: Failed to create /app/message_data directory:', e);
    }
}

function loadChatData(remoteJid, messageId) {
    const chatFilePath = path.join(baseDir, remoteJid, `${messageId}.json`);
    try {
        const data = fs.readFileSync(chatFilePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        console.log(`Toxic-MD Store: No data found for remoteJid=${remoteJid}, messageId=${messageId}`);
        return [];
    }
}

function saveChatData(remoteJid, messageId, chatData) {
    const chatDir = path.join(baseDir, remoteJid);

    if (!fs.existsSync(chatDir)) {
        try {
            fs.mkdirSync(chatDir, { recursive: true });
            console.log(`Toxic-MD Store: Created directory ${chatDir}`);
        } catch (e “

System: It looks like the response was cut off due to length constraints. Let me complete the update for `/app/lib/Store.js` and provide a full plan to ensure `antidelete`, `chatbotpm`, and `antilink` work seamlessly, adapting the `Trashcore-MD` backup logic to `Toxic-MD`. We’ll keep the `Toxic-MD` vibe with `◈━━━━━━━━━━━━━━━━◈`, emojis (🧨, 😈, 🦁, 🥶), and max toxicity! 🗿 Since `chatbotpm` is fixed (✅), we’ll focus on fixing `antidelete` to handle all message types (text, image, video, sticker, document, audio) and verify everything else.

### Issues Recap
- **Antidelete Error**: `TypeError: Cannot read properties of null (reading 'time')` when forwarding `protocolMessage` types in `/app/Functions/antidelete.js`.
- **Cause**: The previous `antidelete` logic didn’t properly handle message storage and retrieval, causing crashes when forwarding non-content messages. The `Trashcore-MD` backup code stores messages in `message_data/<remoteJid>/<messageId>.json` and retrieves them on revocation, which is more robust.
- **Chatbotpm**: Fixed, responding to non-sudo users in PMs with `shizo.top` API output.
- **Goal**: Replace `antidelete` and `Store.js` with the backup logic, update `toxic.js` to integrate it, and test all features.

### Plan
1. **Update `antidelete.js`**:
   - Use the backup’s logic to store incoming messages and retrieve them on revocation.
   - Handle text, image, video, sticker, document, and audio messages.
   - Send notifications with `pict` (toxic.jpg) to `botNumber`.

2. **Update `Store.js`**:
   - Implement `loadChatData` and `saveChatData` to store messages in `/app/message_data/<remoteJid>/<messageId>.json`.
   - Auto-create directories.

3. **Update `toxic.js`**:
   - Adjust to call `antidelete` with the correct settings and ensure compatibility.

4. **Keep Other Files**:
   - `/app/Functions/chatbotpm.js`: Unchanged, working.
   - `/app/Functions/antilink.js`: Unchanged, working for non-admins.
   - `/app/clintplugins/Settings/chatbotpm.js`: Unchanged, toggle works.
   - `/app/Database/config.js`: Unchanged, has `chatbotpm` and `antidelete` settings.

5. **Test All Features**:
   - Verify `antidelete` stores and forwards deleted messages.
   - Confirm `chatbotpm` responds in PMs.
   - Ensure `antilink` deletes non-admin links.

6. **Maintain Vibe**:
   - Keep `Toxic-MD` branding, `◈━━━━━━━━━━━━━━━━◈`, emojis (🧨, 😈, 🦁, 🥶, 😴, 💀).
   - Antidelete: “DELETED MESSAGE DETECTED 🥀”.
   - Chatbotpm error: “Oops, something went wrong with the chatbot, you dumbass! 😈 Try again later!”.

### Updated Files
We’ll update `/app/Functions/antidelete.js`, `/app/lib/Store.js`, and `/app/Client/toxic.js`.

#### Updated File: `/app/Functions/antidelete.js`
```javascript
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