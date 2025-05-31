const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text, botname } = context;

  if (!botname) {
    console.error(`Botname not set, you useless fuck.`);
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
  }

  if (!text) {
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you forgot the damn prompt, you moron! Try something like: .gpt What's the meaning of love?\n◈━━━━━━━━━━━━━━━━◈`);
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodedText}`;
    console.log(`[GPT-DEBUG] Fetching API: ${apiUrl}`);

    const response = await fetch(apiUrl, { timeout: 10000 }); // 10s timeout
    if (!response.ok) {
      throw new Error(`API puked with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[GPT-DEBUG] API response: ${JSON.stringify(data)}`);

    if (!data.success || !data.result) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s being a useless piece of shit, ${m.pushName}! 😤 No answer for you, loser. Try again, you dumb fuck.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const { result } = data;
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Here’s your fucking answer, courtesy of ${botname}:\n${result}\n◈━━━━━━━━━━━━━━━━◈`);
  } catch (error) {
    console.error(`[GPT-ERROR] GPT API fucked up: ${error.stack}`);
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! 😡 API’s down or my circuits are fried. Fuck off and try later, you whiny prick.\n◈━━━━━━━━━━━━━━━━◈`);
  }
};