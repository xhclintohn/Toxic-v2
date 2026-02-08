const linkMiddleware = require('../../utils/botUtil/linkMiddleware');

module.exports = async (context) => {
    await linkMiddleware(context, async () => {
        const { client, m } = context;

        try {
            let response = await client.groupInviteCode(m.chat); 
            await client.sendText(m.chat, 
`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
> 々 *GROUP LINK* ❒
╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
            
https://chat.whatsapp.com/${response}

📌 *Share this link to invite members*
🔗 *Link generated successfully*`, 
            m, { detectLink: true }); 

        } catch (error) {
            console.error('Error generating group link:', error);
            await client.sendText(m.chat, 
`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
> 々 *ERROR* ❒
╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───

❌ Failed to generate group link.
Please try again later.`, 
            m);
        }
    });
};