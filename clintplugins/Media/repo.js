module.exports = {
    name: 'repo',
    async execute(socket, msg) {
        const text = `*『 𝚃𝙾𝚇𝙸𝙲-𝙼𝙸𝙽𝙸-𝙱𝙾𝚃 𝚁𝙴𝙿𝙾 』*

╭───(    \`𝚂𝚢𝚜𝚝𝚎𝚖 𝙸𝚗𝚏𝚘\`    )───
> ───≫ 🔗 𝚁𝙴𝙿𝙾𝚂𝙸𝚃𝙾𝚁𝚈 ≫ <<───
> \`々\` 𝐎𝐰𝐧𝐞𝐫 : xh_clinton
> \`々\` 𝐋𝐢𝐧𝐤 : https://xhclinton.com/minibot
> \`々\` 𝐒𝐭𝐚𝐭𝐮𝐬 : Public/Stable
╰──────────────────☉

*Powered by xh_clinton*`;

        await socket.sendMessage(msg.key.remoteJid, {
            text: text,
            contextInfo: {
                externalAdReply: {
                    title: "Toxic-Mini-Bot Official",
                    body: "Get the latest updates here",
                    thumbnailUrl: 'https://raw.githubusercontent.com/xhclintohn/Music-Clips-Collection/main/mini.png',
                    sourceUrl: "https://xhclinton.com/minibot",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: msg });
    }
};
