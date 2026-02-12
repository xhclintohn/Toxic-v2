const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware'); 

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, Owner, isBotAdmin } = context;

                 if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ This command is meant for groups.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
         if (!isBotAdmin) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ I need admin privileges.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`); 

                 await client.groupParticipantsUpdate(m.chat,  [m.sender], 'promote'); 
 m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PROMOTED ≪───\n├ \n├ Promoted. Now you have power.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`); 
          })

}
