const { getSettings, getSudoUsers } = require("../Database/config");

module.exports = async (client, m, store, chatbotpmSetting) => {
    try {
        // Log entry for debugging
        console.log(`Toxic-MD ChatbotPM: Processing message - remoteJid=${m.key?.remoteJid}, fromMe=${m.key?.fromMe}, message=${JSON.stringify(m.message)}`);

        // Early exit for invalid or group messages
        if (!m || !m.key || !m.message || !m.key.remoteJid.endsWith("@s.whatsapp.net") || m.key.fromMe) {
            console.log(`Toxic-MD ChatbotPM: Skipped - Invalid or group message (remoteJid=${m.key?.remoteJid}, fromMe=${m.key?.fromMe})`);
            return;
        }

        if (!chatbotpmSetting) {
            console.log(`Toxic-MD ChatbotPM: Skipped - chatbotpm=${chatbotpmSetting}`);
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
            console.log(`Toxic-MD ChatbotPM: Skipped - Sender is sudo or bot (sender=${sender})`);
            return;
        }

        const messageContent = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            ""
        ).trim();

        const { prefix } = await getSettings();
        if (messageContent.startsWith(prefix)) {
            console.log(`Toxic-MD ChatbotPM: Skipped - Message starts with prefix (${prefix})`);
            return;
        }

        if (!messageContent) {
            console.log(`Toxic-MD ChatbotPM: Skipped - No valid message content`);
            return;
        }

        console.log(`Toxic-MD ChatbotPM: Processing message from ${sender}: ${messageContent}`);

        try {
            const encodedText = encodeURIComponent(messageContent);
            const apiUrl = `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodedText}`;
            console.log(`Toxic-MD ChatbotPM: Fetching API - ${apiUrl}`);
            const response = await fetch(apiUrl, { timeout: 10000 });
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();
            console.log(`Toxic-MD ChatbotPM: API response - ${JSON.stringify(data)}`);
            if (!data.status || !data.msg) {
                throw new Error("Invalid API response: missing status or msg");
            }
            await client.sendMessage(
                m.key.remoteJid,
                { text: data.msg },
                { quoted: m }
            );
            console.log(`Toxic-MD ChatbotPM: Sent response to ${sender} in ${m.key.remoteJid}: ${data.msg}`);
        } catch (e) {
            console.error(`Toxic-MD ChatbotPM Error:`, e);
            await client.sendMessage(
                m.key.remoteJid,
                { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops, something went wrong with the chatbot, you dumbass! 😈 Try again later!\n┗━━━━━━━━━━━━━━━┛` },
                { quoted: m }
            );
        }
    } catch (e) {
        console.error("Toxic-MD ChatbotPM Error:", e);
    }
};