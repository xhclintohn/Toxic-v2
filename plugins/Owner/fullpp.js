const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware'); 
const { S_WHATSAPP_NET } = require('@whiskeysockets/baileys');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, Owner, generateProfilePicture, botNumber, mime, msgToxic } = context;

try {
const fs = require("fs");

if(!msgToxic) { m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ REPLY TO A FUCKING IMAGE RIGHT NOW!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`); return } ;


let media;
if (msgToxic.imageMessage) {
     media = msgToxic.imageMessage

  } else {
    m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ THIS IS NOT A FUCKING IMAGE!\n├ REPLY TO AN IMAGE!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`); return
  } ;

var medis = await client.downloadAndSaveMediaMessage(media);



                    var {
                        img
                    } = await generateProfilePicture(medis)






client.query({
                tag: 'iq',
                attrs: {
                    target: undefined,
                    to: S_WHATSAPP_NET,
                    type:'set',
                    xmlns: 'w:profile:picture'
                },
                content: [
                    {
                        tag: 'picture',
                        attrs: { type: 'image' },
                        content: img
                    }
                ]
            })

                    fs.unlinkSync(medis)
                    m.reply(`╭───(    TOXIC-MD    )───\n├───≫ UPDATED ≪───\n├ \n├ Bot Profile Picture Updated.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`)

} catch (error) {

m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ An error occured while updating\n├ bot profile photo.\n├ ${error}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`)

}

                })




}
