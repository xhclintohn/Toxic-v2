const fetch = require("node-fetch");

module.exports = async (context) => {
  const { client, m, text, prefix } = context;

  if (!text) {
    return m.reply(`You braindead waste of space, give me something to work with!\nExample: ${prefix}gemini What's 2+2?`);
  }

  if (text.length > 500) {
    return m.reply("Do you think I have infinite patience? Keep your rambling under 500 characters!");
  }

  try {
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

    const encodedText = encodeURIComponent(text);
    const response = await fetch(`https://api-faa.my.id/faa/gemini-ai?text=${encodedText}`);
    const data = await response.json();

    if (!data.status || !data.result) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      return m.reply("Gemini AI decided your question was too stupid to answer. Try something less brain-damaging.");
    }

    await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    await m.reply(`${data.result}\n\nI did all the thinking for you, you're welcome.`);

  } catch (error) {
    console.error("Gemini command error:", error);
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    return m.reply(`Gemini crashed harder than your IQ.\nError: ${error.message}\nTry again when you're less useless.`);
  }
};