const middleware = async (context, next) => {
    const { m, isBotAdmin, isAdmin } = context;

    if (!m.isGroup) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ This command isn’t for lone wolves. Try again in a group. 🐺
◈━━━━━━━━━━━━━━━━◈`);
    }
    if (!isAdmin) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ You think you’re worthy? 
│❒ Admin privileges are required—go beg for them. 😤
◈━━━━━━━━━━━━━━━━◈`);
    }
    if (!isBotAdmin) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ I need admin rights to obey, unlike you who blindly follows. 🫵 
◈━━━━━━━━━━━━━━━━◈`);
    }

    await next(); // Proceed to the next function (main handler)
};

module.exports = middleware;