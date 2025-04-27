const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text, botname } = context;

  if (!botname) {
    console.error(`Botname not set, you useless fuck.`);
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
  }

  if (!text) {
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you forgot the damn prompt, you moron! Try something like: .chatgpt What’s the meaning of life?\n◈━━━━━━━━━━━━━━━━◈`);
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.giftedtech.web.id/api/ai/gpt?apikey=gifted&q=${encodedText}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.success || !data.result) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s being a useless piece of shit, ${m.pushName}. No answer for you, loser. Try again.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const { result } = data;
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Here’s your fucking answer, courtesy of ${botname}:\n${result}\n◈━━━━━━━━━━━━━━━━◈`);
  } catch (error) {
    console.error(`GPT API fucked up: ${error.stack}`);
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}. API’s down or something. Fuck off and try later.\n◈━━━━━━━━━━━━━━━━◈`);
  }
};