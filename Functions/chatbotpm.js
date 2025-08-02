const { getSettings, getSudoUsers } = require("../Database/config");

module.exports = async (client, m, store, chatbotpmSetting) => {
    try {
        // Early exit for invalid, group, or non-notify messages
        if (!m || !m.key || !m.message || !m.key.remoteJid.endsWith("@s.whatsapp.net") || m.key.fromMe || m.type !== "notify") {
            return;
        }

        if (!chatbotpmSetting) {
            return;
        }

        const botNumber = await client.decodeJid(client.user.id);
        const sender = m.sender ? await client.decodeJid(m.sender) : null;
        const senderNumber = sender ? sender.split('@')[0] : null;

        if (!sender || !senderNumber) {
            console.error(`Toxic-MD ChatbotPM: Skipped - No valid sender for message in ${m.key.remoteJid}`);
            return;
        }

        const sudoUsers = await getSudoUsers();
        if (sudoUsers.includes(senderNumber) || sender === botNumber) {
            return;
        }

        const messageContent = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            ""
        ).trim();

        const { prefix } = await getSettings();
        if (messageContent.startsWith(prefix)) {
            return;
        }

        if (messageContent) {
            try {
                const encodedText = encodeURIComponent(messageContent);
                const apiUrl = `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodedText}`;
                const response = await fetch(apiUrl, { timeout: 10000 });
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                const data = await response.json();
                if (!data.status || !data.msg) {
                    throw new Error("Invalid API response: missing status or msg");
                }
                await client.sendMessage(
                    m.key.remoteJid,
                    { text: data.msg },
                    { quoted: m }
                );
                console.log(`Toxic-MD ChatbotPM: Sent response to ${sender} in ${m.key.remoteJid}`);
            } catch (e) {
                console.error(`Toxic-MD ChatbotPM Error:`, e);
                await client.sendMessage(
                    m.key.remoteJid,
                    { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops, something went wrong with the chatbot, you dumbass! 😈 Try again later!\n┗━━━━━━━━━━━━━━━┛` },
                    { quoted: m }
                );
            }
        }
    } catch (e) {
        console.error("Toxic-MD ChatbotPM Error:", e);
    }
};