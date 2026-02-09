const middleware = async (context, next) => {
    const { m, isBotAdmin, isAdmin } = context;

    if (!m.isGroup) {
        return m.reply(`*𝐓𝐨𝐱𝐢𝐜-𝐌D Gʀᴏᴜᴘ Oɴʟʏ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Rᴇsᴛʀɪᴄᴛᴇᴅ ≪───\n> \`々\` This command is for groups only.\n> \`々\` Go find a group, lone wolf.\n╰──────────────────☉`);
    }
    if (!isAdmin) {
        return m.reply(`*𝐓𝐨𝐱𝐢𝐜-𝐌D Aᴅᴍɪɴ Oɴʟʏ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Nᴏ Pᴇʀᴍɪssɪᴏɴ ≪───\n> \`々\` Admin privileges required.\n> \`々\` Go beg for admin rights,\n> \`々\` you pathetic peasant.\n╰──────────────────☉`);
    }
    if (!isBotAdmin) {
        return m.reply(`*𝐓𝐨𝐱𝐢𝐜-𝐌D Nᴇᴇᴅs Aᴅᴍɪɴ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Bᴏᴛ Nᴏᴛ Aᴅᴍɪɴ ≪───\n> \`々\` I need admin rights to do this.\n> \`々\` Make me admin first, fool.\n╰──────────────────☉`);
    }

    await next();
};

module.exports = middleware;
