// tempmail.js

module.exports = async (context) => {
    const { client, m } = context;

    try {
        const res = await fetch("https://tempmail.apinepdev.workers.dev/api/gen");
        const data = await res.json();

        if (!data.email || !data.token) {
            return m.reply("Failed to generate temp mail. Try again.");
        }

        const email = data.email;
        const token = data.token;

        // Send email
        await m.reply(`📧 Your Temp Email:\n${email}`);

        // Send token in quoted message
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
        return m.reply("API error. Could not generate temp email.");
    }
};