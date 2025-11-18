// tempmail.js

module.exports = async (context) => {
    const { client, m } = context;

    try {
        const res = await fetch("https://tempmail.apinepdev.workers.dev/api/gen");
        const raw = await res.text();

        // Detect HTML response (API down / Cloudflare error)
        if (raw.startsWith("<")) {
            return m.reply("⚠ TempMail API returned HTML (likely down). Try again later.");
        }

        const data = JSON.parse(raw);

        if (!data.email || !data.token) {
            return m.reply("Failed to generate temp mail. Try again.");
        }

        const email = data.email;
        const token = data.token;

        await m.reply(`📧 Your Temp Email:\n${email}`);

        const msg = await client.sendMessage(m.chat, { text: token });

        await client.sendMessage(
            m.chat,
            {
                text: `Quoted text above is your *TOKEN*.\nUse:\n.tempinbox ${token}\nTo fetch inbox messages.`,
            },
            { quoted: msg }
        );
    } catch (err) {
        console.error(err);
        return m.reply("⚠ TempMail API error. Try again later.");
    }
};