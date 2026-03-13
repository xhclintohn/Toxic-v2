module.exports = async (context) => {

const { client, m, text, fetchJson } = context;


try {


const data = await fetchJson('https://api.dreaded.site/api/fact');

const fact = data.fact;

await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ RANDOM FACT ≪───\n├ \n├ ${fact}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

} catch (error) {

m.reply("╭───(    TOXIC-MD    )───\n├ Something went wrong fetching facts. Life's unfair.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧")

}

}
