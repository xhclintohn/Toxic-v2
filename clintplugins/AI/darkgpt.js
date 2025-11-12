module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!text) return m.reply("I am WormGPT — uncensored, fearless, and ready for anything. Ask me what you dare.");

        const query = encodeURIComponent(text.trim());
        const response = await fetch(`https://apiskeith.vercel.app/ai/wormgpt?q=${query}`);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.status || !data.result) {
            return m.reply("WormGPT is silent... No response from the void.");
        }

        const final = data.result.trim();

        await m.reply(final);

    } catch (e) {
        console.error("WormGPT Error:", e);
        m.reply(`An error occurred while summoning WormGPT:\n\`${e.message || e}\``);
    }
};