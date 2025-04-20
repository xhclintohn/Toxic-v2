//ping.js

module.exports = async (context) => {
        const { client, m, toxicspeed } = context;


await m.reply(`Pong\n${toxicspeed.toFixed(4)}ms`)

}