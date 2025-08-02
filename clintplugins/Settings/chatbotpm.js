const { getSettings, setSettings } = require('../../Database/config');

module.exports = {
    name: "chatbotpm",
    alias: ["chatbot"],
    desc: "Enable or disable chatbot in private messages",
    category: "Settings",
    usage: "chatbotpm [on/off]",
    run: async ({ client, m, args, prefix }) => {
        try {
            const settings = await getSettings();
            let check = settings.chatbotpm ? "ON 🥶" : "OFF 😴";

            if (!args[0]) {
                return await client.sendMessage(
                    m.key.remoteJid,
                    {
                        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *ChatbotPM*: ${check}\n│❒ Use *${prefix}chatbotpm on* to enable or *${prefix}chatbotpm off* to disable\n┗━━━━━━━━━━━━━━━┛`,
                        footer: "> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ",
                        buttons: [
                            { buttonId: `${prefix}chatbotpm on`, buttonText: { displayText: "Turn On 🥶" }, type: 1 },
                            { buttonId: `${prefix}chatbotpm off`, buttonText: { displayText: "Turn Off 😴" }, type: 1 }
                        ]
                    },
                    { quoted: m }
                );
            }

            let value = args[0].toLowerCase();
            if (value === "on") {
                if (settings.chatbotpm) {
                    return await client.sendMessage(m.key.remoteJid, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ ChatbotPM is already enabled, you dumbass! 😈\n┗━━━━━━━━━━━━━━━┛` }, { quoted: m });
                }
                settings.chatbotpm = true;
                await setSettings(settings);
                return await client.sendMessage(m.key.remoteJid, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ ChatbotPM enabled! Ready to roast in PMs! 🧨\n┗━━━━━━━━━━━━━━━┛` }, { quoted: m });
            } else if (value === "off") {
                if (!settings.chatbotpm) {
                    return await client.sendMessage(m.key.remoteJid, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ ChatbotPM is already disabled, you loser! 😴\n┗━━━━━━━━━━━━━━━┛` }, { quoted: m });
                }
                settings.chatbotpm = false;
                await setSettings(settings);
                return await client.sendMessage(m.key.remoteJid, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ ChatbotPM disabled! No more PM roasting! 😴\n┗━━━━━━━━━━━━━━━┛` }, { quoted: m });
            } else {
                return await client.sendMessage(m.key.remoteJid, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Use *${prefix}chatbotpm on* or *${prefix}chatbotpm off*, you idiot! 😈\n┗━━━━━━━━━━━━━━━┛` }, { quoted: m });
            }
        } catch (e) {
            console.error("Toxic-MD ChatbotPM Error:", e);
            await client.sendMessage(m.key.remoteJid, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops, something broke, you dumbass! 😈 Try again later!\n┗━━━━━━━━━━━━━━━┛` }, { quoted: m });
        }
    }
};