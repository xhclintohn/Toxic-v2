await client.sendMessage(m.chat, {
    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Welcome to ${botname}, B*tches!* 😈\n\n` +
          `🤖 *Bσƚ*: ${botname}\n` +
          `🔣 *Pɾҽϝιx*: ${effectivePrefix || 'None'}\n` +
          `🌐 *Mσԃҽ*: ${mode}\n` +
          `\n◈━━━━━━━━━━━━━━━━◈\n\n` +
          `*Select an option Below, Loser.* 😈`,
    footer: `Pσɯҽɾҽԃ Ⴆყ ${botname}`,
    title: `${botname} COMMAND MENU`,
    buttonText: "VIEW OPTIONS",
    sections: [
        {
            title: "MAIN COMMANDS",
            rows: [
                {
                    title: "📃 FULL MENU",
                    description: "Show all commands",
                    rowId: `${effectivePrefix}fullmenu`
                },
                {
                    title: "👤 DEVELOPER",
                    description: "Contact developer",
                    rowId: `${effectivePrefix}dev`
                }
            ]
        },
        {
            title: "BOT INFO",
            rows: [
                {
                    title: "🚨 PING",
                    description: "Check bot speed",
                    rowId: `${effectivePrefix}ping`
                },
                {
                    title: "🤖 REPOSITORY",
                    description: "Get source code",
                    rowId: `${effectivePrefix}repo`
                }
            ]
        }
    ]
}, { quoted: m });