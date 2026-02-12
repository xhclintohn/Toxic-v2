const linkMiddleware = require('../../utils/botUtil/linkMiddleware');

module.exports = async (context) => {
    await linkMiddleware(context, async () => {
        const { client, m } = context;

        try {
            let response = await client.groupInviteCode(m.chat); 
            await client.sendText(m.chat, 
`╭───(    TOXIC-MD    )───
├───≫ GROUP LINK ≪───
├ 
├ https://chat.whatsapp.com/${response}
├ 
├ Share this link to invite members.
├ Link generated successfully.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, 
            m, { detectLink: true }); 

        } catch (error) {
            console.error('Error generating group link:', error);
            await client.sendText(m.chat, 
`╭───(    TOXIC-MD    )───
├───≫ ERROR ≪───
├ 
├ Failed to generate group link.
├ Try again later, fool.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, 
            m);
        }
    });
};
