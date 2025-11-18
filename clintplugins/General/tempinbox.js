// tempinbox.js

module.exports = async (context) => {
    const { client, m, text } = context;

    if (!text)
        return m.reply(
            "Provide your token.\nExample:\n.tempinbox YOUR_TOKEN"
        );

    try {
        const url = `https://tempmail.apinepdev.workers.dev/api/getmessage?emaill=${encodeURIComponent(
            text
        )}`;

        const res = await fetch(url);
        const raw = await res.text();

        // Detect API returning HTML
        if (raw.startsWith("<")) {
            return m.reply("⚠ TempMail API returned HTML (likely down). Try again later.");
        }

        const data = JSON.parse(raw);

        if (data.error) {
            return m.reply(`API Error: ${data.error}`);
        }

        if (!data.messages || data.messages.length === 0) {
            return m.reply("Your inbox is empty or token is invalid.");
        }

        for (const msg of data.messages) {
            const parsed = JSON.parse(msg.message);

            const sender = msg.sender || "Unknown";
            const subject = msg.subject || "No subject";
            const date = new Date(parsed.date).toLocaleString();
            const body = parsed.body || "No message body";

            const out = `👥 Sender: ${sender}
📝 Subject: ${subject}
🕜 Date: ${date}
📩 Message: ${body}`;

            await m.reply(out);
        }
    } catch (err) {
        console.error(err);
        return m.reply("⚠ Error fetching inbox. Try again later.");
    }
};