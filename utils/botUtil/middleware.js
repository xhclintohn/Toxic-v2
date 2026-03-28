const DEV_NUMBER = '254735342808';

const normalizeNumber = (jid) => {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
};

const middleware = async (context, next) => {
    const { m, isBotAdmin } = context;
    const isDev = normalizeNumber(m.sender) === normalizeNumber(DEV_NUMBER);

    if (!m.isGroup) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Gʀᴏᴜᴘ Oɴʟʏ ≪───\n├ \n├ This command isn't for lone wolves.\n├ Try again in a group, you loner.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
    if (!isDev && !context.isAdmin) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Nᴏᴛ Aᴅᴍɪɴ ≪───\n├ \n├ You think you're worthy?\n├ Admin privileges are required—\n├ go beg for them, peasant.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
    if (!isBotAdmin) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Bᴏᴛ Nᴏᴛ Aᴅᴍɪɴ ≪───\n├ \n├ I need admin rights to obey,\n├ unlike you who blindly follows.\n├ Make me admin first, idiot.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    await next();
};

module.exports = middleware;
