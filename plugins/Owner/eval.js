const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

    
module.exports = async (context) => {
await ownerMiddleware(context, async () => {

  const { 
    client, m, text, Owner, chatUpdate, store, isBotAdmin, isAdmin, IsGroup, 
    participants, pushname, body, budy, totalCommands, args, mime, qmsg, msgDreaded, 
    botNumber, itsMe, packname, author, generateProfilePicture, groupMetadata, 
    toxicpeed, mycode, fetchJson, exec, getRandom, UploadFileUgu, TelegraPh, 
    prefix, cmd, botname, mode, gcpresence, antitag, antidelete, antionce, 
    fetchBuffer, uploadtoimgur, ytmp3, getGroupAdmins, Tag
  } = context;

  
  

  try {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ No command provided for eval!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

   
    let evaled = await eval(trimmedText);

    
    if (typeof evaled !== 'string') {
      evaled = require('util').inspect(evaled);
    }

    await m.reply(evaled);

  } catch (err) {
    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ EVAL ERROR ≪───\n├ \n├ ${String(err)}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
                })
};
