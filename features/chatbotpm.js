const fetch = require('node-fetch');

module.exports = async (client, m, store, chatbotpmSetting, prefix, sudoUsers) => {
    try {
        if (!m || !m.key || !m.message || !m.key.remoteJid.endsWith("@s.whatsapp.net") || m.key.fromMe) {
            return;
        }

        if (!(chatbotpmSetting === true || chatbotpmSetting === 'true')) {
            return;
        }

        const botNumber = await client.decodeJid(client.user.id);
        const sender = m.sender ? await client.decodeJid(m.sender) : null;
        const senderNumber = sender ? sender.split('@')[0] : null;

        if (!sender || !senderNumber) {
            return;
        }

        const sudoList = Array.isArray(sudoUsers) ? sudoUsers.map(v => String(v).replace(/[^0-9]/g, '')).filter(Boolean) : [];
        if (sudoList.includes(senderNumber) || sender === botNumber) {
            return;
        }

        const messageContent = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            ""
        ).trim();

        const effectivePrefix = (typeof prefix === 'string' && prefix.length) ? prefix : '.';
        if (messageContent.startsWith(effectivePrefix)) {
            return;
        }

        if (!messageContent) {
            return;
        }

        try {
            const encodedText = encodeURIComponent(messageContent);
            const apiUrl = `https://api.nexray.web.id/ai/chatgpt?text=${encodedText}`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            let response;
            try {
                response = await fetch(apiUrl, { signal: controller.signal });
            } finally {
                clearTimeout(timeout);
            }

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();

            if (!data.status || !data.result) {
                throw new Error("invalid API response");
            }

            await client.sendMessage(
                m.key.remoteJid,
                { text: data.result },
                { quoted: m }
            );

        } catch (e) {
            console.error(`toxic-md chatbotpm error:`, e);
            await client.sendMessage(
                m.key.remoteJid,
                { text: `chatbot error: ${e.message}` },
                { quoted: m }
            );
        }
    } catch (e) {
        console.error("toxic-md chatbotpm error:", e);
    }
};