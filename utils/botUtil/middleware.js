const middleware = async (context, next) => {
    const { m, isBotAdmin, isAdmin } = context;

    if (!m.isGroup) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Gʀᴏᴜᴘ Oɴʟʏ ≪───\n々 This command isn't for lone wolves.\n々 Try again in a group, you loner. 🐺\n╭───(  )───`);
    }
    if (!isAdmin) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Nᴏᴛ Aᴅᴍɪɴ ≪───\n々 You think you're worthy?\n々 Admin privileges are required—\n々 go beg for them, peasant. 😤\n╭───(  )───`);
    }
    if (!isBotAdmin) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Bᴏᴛ Nᴏᴛ Aᴅᴍɪɴ ≪───\n々 I need admin rights to obey,\n々 unlike you who blindly follows. 🫵\n々 Make me admin first, idiot.\n╭───(  )───`);
    }

    await next();
};

module.exports = middleware;