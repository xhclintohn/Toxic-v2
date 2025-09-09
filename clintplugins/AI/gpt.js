const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text, botname } = context;

  if (!botname) {
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s screwed, no botname set. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
  }

  if (!text) {
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, ${m.pushName}, you forgot the damn prompt! Try: .gpt What’s the meaning of life?\n◈━━━━━━━━━━━━━━━━◈`);
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.giftedtech.co.ke/api/ai/gpt4o?apikey=gifted&q=${encodedText}`;
    const response = await fetch(apiUrl, { timeout: 10000 });
    if (!response.ok) {
      throw new Error(`API puked with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.result) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s useless, ${m.pushName}! No answer, try again, loser.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    await m.reply(`${data.result}\n\n> ρσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`);
  } catch (error) {
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! API’s down, try later, you whiny prick.\n◈━━━━━━━━━━━━━━━━◈`);
  }
};