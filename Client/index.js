client.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    let settings = await getSettings();
    if (!settings) return;

    const { autoread, autolike, autoview, presence, autolikeemoji } = settings;

    let mek = messages[0];
    if (!mek || !mek.key) return;

    const remoteJid = mek.key.remoteJid;
    const sender = client.decodeJid(mek.key.participant || mek.key.remoteJid);

    if (remoteJid === "status@broadcast") {
        if (autolike && mek.key) {
            try {
                let reactEmoji = autolikeemoji || 'random';

                if (reactEmoji === 'random') {
                    const emojis = ['❤️', '👍', '🔥', '😍', '👏', '🎉', '🤩', '💯', '✨', '🌟'];
                    reactEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                }

                const nickk = client.decodeJid(client.user.id);

                await client.sendMessage(mek.key.remoteJid, { 
                    react: { 
                        text: reactEmoji, 
                        key: mek.key 
                    } 
                }, { statusJidList: [mek.key.participant, nickk] });
            } catch (sendError) {
                try {
                    await client.sendMessage(mek.key.remoteJid, { 
                        react: { 
                            text: reactEmoji, 
                            key: mek.key 
                        } 
                    });
                } catch (error2) {
                    console.error('❌ [AUTOLIKE] Failed to react:', error2.message);
                }
            }
        }

        if (autoview) {
            try {
                await client.readMessages([mek.key]);

                setTimeout(async () => {
                    try {
                        await client.readMessages([mek.key]);
                    } catch (error) {}
                }, 500);
            } catch (error) {
                console.error('❌ [AUTOVIEW] Failed to view:', error.message);
            }
        }

        return;
    }

    if (!mek.message) return;

    mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

    if (!mek.message) {
        console.error('❌ [MESSAGE HANDLER] mek.message is undefined');
        return;
    }

    await antilink(client, mek, store);

    if (autoread && remoteJid.endsWith('@s.whatsapp.net')) {
        try {
            await client.readMessages([mek.key]);
        } catch (error) {}
    }

    if (remoteJid.endsWith('@s.whatsapp.net')) {
        const Chat = remoteJid;
        if (presence === 'online') {
            try {
                await client.sendPresenceUpdate("available", Chat);
            } catch (error) {}
        } else if (presence === 'typing') {
            try {
                await client.sendPresenceUpdate("composing", Chat);
            } catch (error) {}
        } else if (presence === 'recording') {
            try {
                await client.sendPresenceUpdate("recording", Chat);
            } catch (error) {}
        } else {
            try {
                await client.sendPresenceUpdate("unavailable", Chat);
            } catch (error) {}
        }
    }

    if (!client.public && !mek.key.fromMe) return;

    try {
        m = smsg(client, mek, store);
        require("./toxic")(client, m, { type: "notify" }, store);
    } catch (error) {
        console.error('❌ [MESSAGE HANDLER] Error:', error.message);
    }
});