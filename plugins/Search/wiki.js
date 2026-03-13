module.exports = async (context) => {

const { client, m, text } = context;



const wiki = require('wikipedia');

        try {
            if (!text) return m.reply("╭───(    TOXIC-MD    )───\n├ Provide a term to search, you lazy fool.\n├ E.g: What is JavaScript!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧")
            const con = await wiki.summary(text);
            const texa = `╭───(    TOXIC-MD    )───\n├───≫ WIKIPEDIA ≪───\n├ \n├ Title: ${con.title}\n├ Desc: ${con.description}\n├ \n├ Summary: ${con.extract}\n├ \n├ URL: ${con.content_urls.mobile.page}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            m.reply(texa)
        } catch (err) {
            console.log(err)
            return m.reply("╭───(    TOXIC-MD    )───\n├ Got 404. Couldn't find anything, try harder.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧")
        }
    }
