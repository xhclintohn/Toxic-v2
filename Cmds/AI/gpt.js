module.exports = async (context) => {
  const { client, m, text, botname, fetchJson } = context;

  if (!text) {
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, moron, give me some text to work with! Don’t waste my time.`);
  }

  try {
    const encodedText = encodeURIComponent(text);
    const data = await fetchJson(`https://api.dreaded.site/api/chatgpt?text=${encodedText}`);

    if (data && data.result && data.result.prompt) {
      const res = data.result.prompt;
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Here’s your damn answer, courtesy of ${botname}:\n${res}`);
    } else {
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s being a bitch, gave me nothing useful. Try again, loser.`);
    }
  } catch (error) {
    console.error('ChatGPT API error:', error);
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit hit the fan, API’s broken or something. Bug off and try later.`);
  }
};