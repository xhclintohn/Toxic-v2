const Ownermiddleware = async (context, next) => {
    const { m, Owner } = context;

    if (!Owner) {
        return m.reply(`*𝐓𝐨𝐱𝐢𝐜-𝐌D Oᴡɴᴇʀ Oɴʟʏ*\n\n╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌D\`    )───\n> ───≫ Aᴄᴄᴇss Dᴇɴɪᴇᴅ ≪───\n> \`々\` You dare use an Owner command?\n> \`々\` Your mere existence insults\n> \`々\` my code. Crawl back to the\n> \`々\` abyss where mediocrity thrives.\n╰──────────────────☉`);
    }

    await next();
};

module.exports = Ownermiddleware;
