module.exports = async (context) => {

const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');
    await ownerMiddleware(context, async () => {

    const { client, m } = context;
    const fq = getFakeQuoted(m);

const Myself = await client.decodeJid(client.user.id);
    
    const {
                readreceipts,
                profile,
                status,
                online,
                last,
                groupadd,
                calladd
        } = await client.fetchPrivacySettings(true);
        
        const fnn = `╭───(    TOXIC-MD    )───\n├───≫ PRIVACY SETTINGS ≪───\n├ \n├ Name: ${client.user.name}\n├ Online: ${online}\n├ Profile Picture: ${profile}\n├ Last Seen: ${last}\n├ Read Receipt: ${readreceipts}\n├ Group Add: ${groupadd}\n├ Status: ${status}\n├ Call Add: ${calladd}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;


const avatar = await client.profilePictureUrl(Myself, 'image').catch(_ => 'https://telegra.ph/file/b34645ca1e3a34f1b3978.jpg');

await client.sendMessage(m.chat, { image: { url: avatar}, caption: fnn}, { quoted: fq }) 


})

}
        
