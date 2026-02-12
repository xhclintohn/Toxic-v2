module.exports = async (context) => {
    const { client, m, text } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Provide a query, you walnut.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "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" });

        const model = process.env.GROQ_MODEL || "llama3-8b-8192";
        const systemMessage = process.env.GROQ_SYSTEM_MSG || "Make sure the answer is simple and easy to understand.";

        async function getGroqChatCompletion(query) {
            return groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: systemMessage,
                    },
                    {
                        role: "user",
                        content: query,
                    },
                ],
                model: model,
            });
        }

        const chatCompletion = await getGroqChatCompletion(text);
        const content = chatCompletion.choices[0]?.message?.content || "No response received.";

        await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├───≫ Gʀᴏǫ Rᴇsᴘᴏɴsᴇ ≪───\n├ \n├ ${content}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });

    } catch (error) {
        console.error("Error:", error);
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ An error occurred.\n├ ${error}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
