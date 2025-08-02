const { message_data } = require("../lib/Store");

module.exports = async (client, m, store, pict) => {
    try {
        const { remoteJid, participant } = m.key;
        const settings = await require('../Database/config').getSettings();
        if (!settings || !settings.antidelete || !m.message || m.key.fromMe) {
            return;
        }

        const type = Object.keys(m.message)[0];
        const content = JSON.stringify(m.message);
        const from = remoteJid;

        let msg = await message_data.check({ from });
        if (!msg) {
            msg = await message_data.save({ from });
        }

        const botNumber = await client.decodeJid(client.user.id);
        if (remoteJid === botNumber || participant === botNumber) return;

        await client.sendMessage(botNumber, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *DELETED MESSAGE DETECTED* 🥀\n│❒ *From*: ${from}\n│❒ *Sender*: ${participant || remoteJid}\n│❒ *Type*: ${type}\n│❒ *Content*: ${content}\n┗━━━━━━━━━━━━━━━┛`,
            contextInfo: {
                externalAdReply: {
                    title: "Toxic-MD Antidelete",
                    body: `Message deleted in ${from}`,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: pict,
                    sourceUrl: `https://github.com/xhclintohn/Toxic-MD`
                }
            }
        });

        if (type === "conversation" || type === "extendedTextMessage") {
            await client.sendMessage(botNumber, { text: content });
        } else if (type.includes("Message")) {
            await client.sendMessage(botNumber, m.message);
        }
    } catch (e) {
        console.error("Toxic-MD Antidelete Error:", e);
    }
};