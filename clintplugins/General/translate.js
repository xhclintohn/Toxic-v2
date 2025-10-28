const axios = require("axios");

module.exports = async (context) => {
    const { m, text, client } = context;

    try {
        // Extract text and language from user input
        // Examples:
        //  .translate
        //  .translate en
        //  .translate french
        //  .translate to swahili
        const input = text ? text.trim() : "";
        const args = input.split(" ");
        let lang = "en"; // Default: English

        // Try to find language code or name in the text
        if (args[0]?.toLowerCase() === "to") lang = args[1] || "en";
        else if (args[0]) lang = args[0];

        // Determine target text
        const targetText = m.quoted?.text || input.replace(/to\s+\w+/, "").trim() || "";

        if (!targetText) {
            return m.reply(
                "◈━━━━━━━━━━━━━━━━◈\n❒ Please reply to a text or provide text to translate.\n❒ Example: *.translate to french* or reply with *.translate en*\n◈━━━━━━━━━━━━━━━━◈"
            );
        }

        await m.reply("◈━━━━━━━━━━━━━━━━◈\n❒ Translating your text, please wait... 🌐\n◈━━━━━━━━━━━━━━━━◈");

        // Send request to FGSI Translate API
        const response = await axios.get("https://fgsi.koyeb.app/api/tools/translate", {
            params: {
                apikey: "fgsiapi-2dcdfa06-6d",
                text: targetText,
                from: "auto",
                to: lang,
            },
            headers: { accept: "application/json" },
        });

        const data = response.data;

        if (!data || !data.result) {
            return m.reply("◈━━━━━━━━━━━━━━━━◈\n❒ Failed to translate text. Try again later.\n◈━━━━━━━━━━━━━━━━◈");
        }

        // Send translated result
        await client.sendMessage(
            m.chat,
            {
                text: `◈━━━━━━━━━━━━━━━━◈
❒ *Original:* ${targetText}
❒ *Translated (${lang.toUpperCase()}):* ${data.result}
◈━━━━━━━━━━━━━━━━◈`,
            },
            { quoted: m }
        );
    } catch (error) {
        console.error("Translate error:", error.message);
        await m.reply(
            `◈━━━━━━━━━━━━━━━━◈\n❒ Error while translating: ${error.response?.data?.message || error.message}\n◈━━━━━━━━━━━━━━━━◈`
        );
    }
};