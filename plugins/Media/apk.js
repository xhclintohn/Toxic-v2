module.exports = async (context) => {

const { client, m, text, fetchJson } = context;


try {
if (!text) return m.reply("╭───(    TOXIC-MD    )───\n├ Provide an app name, you brainless creature!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

let data = await fetchJson (`https://bk9.fun/search/apk?q=${text}`);
        let dreaded = await fetchJson (`https://bk9.fun/download/apk?id=${data.BK9[0].id}`);
         await client.sendMessage(
              m.chat,
              {
                document: { url: dreaded.BK9.dllink },
                fileName: dreaded.BK9.name,
                mimetype: "application/vnd.android.package-archive"}, { quoted: m });

} catch (error) {

m.reply("╭───(    TOXIC-MD    )───\n├───≫ APK ERROR ≪───\n├ \n├ APK download failed, not my problem.\n├ " + error + "\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧")

}
};
