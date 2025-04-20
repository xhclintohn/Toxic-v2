

const Ownermiddleware = async (context, next) => {
    const { m, Owner } = context;

    if (!Owner) {
        return m.reply("𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐦𝐲 𝐨𝐰𝐧𝐞𝐫 𝐬𝐨 𝐅𝐯𝐜𝐤 𝐨𝐟𝐟 𝐨𝐫 𝐈'𝐥𝐥 𝐞𝐱𝐭𝐫𝐚𝐦𝐢𝐧𝐚𝐭𝐞 𝐲𝐨𝐮👺💀.");
    }

    await next();
};

module.exports = Ownermiddleware;