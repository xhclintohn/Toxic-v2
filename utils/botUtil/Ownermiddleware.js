const Ownermiddleware = async (context, next) => {
    const { m, Owner } = context;

    if (!Owner) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Aᴄᴄᴇss Dᴇɴɪᴇᴅ ≪───\n々 You dare use an Owner command?\n々 Your mere existence insults\n々 my code. Crawl back to the\n々 abyss where mediocrity thrives.\n╭───( ✓ )───`);
    }

    await next();
};

module.exports = Ownermiddleware;
