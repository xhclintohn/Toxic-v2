const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware'); 
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {


        const { client, m, args, participants, text } = context;
        const fq = getFakeQuoted(m);


if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Command meant for groups.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);



client.sendMessage(m.chat, { text : text ? text : 'Attention Here' , mentions: participants.map(a => a.id)}, { quoted: fq });

});

}
