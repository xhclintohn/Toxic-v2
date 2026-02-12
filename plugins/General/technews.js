module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        const response = await fetch('https://fantox001-scrappy-api.vercel.app/technews/random');
        const data = await response.json();

        const { thumbnail, news } = data;

        await client.sendMessage(m.chat, { image: { url: thumbnail }, caption: `╭───(    TOXIC-MD    )───\n├───≫ Tᴇᴄʜ Nᴇᴡs ≪───\n├ \n├ ${news}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });
    } catch (error) {
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Failed to fetch tech news.\n├ Try again later.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
}
