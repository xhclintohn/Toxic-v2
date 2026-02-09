module.exports = async (context, next) => {
    const { m, isBotAdmin } = context;

    if (!m.isGroup) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
々 This command only works in groups! 
╭───( ✓ )───`);
    }
    
    if (!isBotAdmin) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
々 I need admin rights to get the group link! 
╭───( ✓ )───`);
    }

    await next(); // Proceed to the next function (main handler)
};