module.exports = async (context) => {

    const { client, m, text, fetchJson } = context;

    try {

        const data = await fetchJson('https://api.dreaded.site/api/standings/SA');

        const standings = data.data;

        const message = `╭───(    TOXIC-MD    )───\n├───≫ SERIE A ≪───\n├ \n${standings}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await m.reply(message);

    } catch (error) {
        m.reply("╭───(    TOXIC-MD    )───\n├ Can't fetch Serie A standings. Try again later.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    }

}
