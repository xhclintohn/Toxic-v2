const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, text, Owner } = context;

  try {

      let getGroupzs = await client.groupFetchAllParticipating();
      let groupzs = Object.entries(getGroupzs)
          .slice(0)
          .map((entry) => entry[1]);
      let anaa = groupzs.map((v) => v.id);
      let jackhuh = `╭───(    TOXIC-MD    )───\n├───≫ BOT GROUPS ≪───\n├ \n`
      await m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Bot is in ${anaa.length} groups,\n├ fetching and sending their jids!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`)
      const promises = anaa.map((i) => {
        return new Promise((resolve) => {
          client.groupMetadata(i).then((metadat) => {
            setTimeout(() => {
              jackhuh += `├ Subject: ${metadat.subject}\n`
              jackhuh += `├ Members: ${metadat.participants.length}\n`
              jackhuh += `├ Jid: ${i}\n├ \n`
              resolve()
            }, 500);
          })
        })
      })
      await Promise.all(promises)
      jackhuh += `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      m.reply(jackhuh);

  } catch (e) {
    m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Error occured while accessing\n├ bot groups.\n├ ${e}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`)
  }

  });
}
