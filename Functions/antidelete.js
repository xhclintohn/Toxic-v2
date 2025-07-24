const { proto, generateMessageID } = require("baileys-pro");
const { getSettings } = require("../Database/config");

module.exports = async (client, m, store) => {
    try {
        const settings = await getSettings();
        if (!settings || !settings.antidelete) return;

        const botNumber = await client.decodeJid(client.user.id);

        if (m?.message?.protocolMessage?.type === 0) {
            console.log("Deleted Message Detected!");
            if (!store || typeof store.loadMessage !== "function") {
                console.log("Error: Store is not initialized or loadMessage is not available.");
                return;
            }

            const deletedP = m.message.protocolMessage.key;
            const deletedM = await store.loadMessage(deletedP.remoteJid, deletedP.id);

            if (!deletedM) {
                console.log("Deleted message detected, error retrieving...");
                return;
            }

            deletedM.message = {
                [deletedM.mtype || "msg"]: deletedM?.msg
            };

            const M = proto?.WebMessageInfo;
            const msg = M.fromObject(M.toObject(deletedM));

            // Forward to bot's number for both groups and PMs
            await client.relayMessage(botNumber, msg.message, {
                messageId: generateMessageID()
            });
        }
    } catch (e) {
        console.log("Error in antidelete:", e);
    }
};