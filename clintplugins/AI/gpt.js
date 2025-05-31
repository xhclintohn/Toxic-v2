const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text, botname } = context;

  if (!botname) {
    console.error(`Botname’s missing, you absolute moron.`);
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s screwed because you didn’t set a botname, genius. Go cry to your dev, dumbass.\n◈━━━━━━━━━━━━━━━━◈`);
  }

  if (!text) {
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, ${m.pushName}, you braindead idiot! No prompt? Try something like: .gpt What’s the meaning of life, you tool?\n◈━━━━━━━━━━━━━━━━◈`);
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodedText}`;
    console.log(`[GPT-DEBUG] Hitting this shitty API: ${apiUrl}`);

    const response = await fetch(apiUrl, { timeout: 10000 }); // 10s timeout
    if (!response.ok) {
      throw new Error(`API’s being a total prick with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[GPT-DEBUG] API spat out: ${JSON.stringify(data)}`);

    if (!data.status || !data.msg) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s a useless pile of crap, ${m.pushName}! 😤 No response worth a damn. Try again, you pathetic loser.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const { msg } = data;
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Here’s your damn answer from ${botname}, you ungrateful twit:\n${msg}\n◈━━━━━━━━━━━━━━━━◈`);
  } catch (error) {
    console.error(`[GPT-ERROR] API fucked up hard: ${error.stack}`);
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Everything’s gone to shit, ${m.pushName}! 😡 API’s dead or I’m broken. Piss off and try later, you annoying bastard.\n◈━━━━━━━━━━━━━━━━◈`);
  }
};