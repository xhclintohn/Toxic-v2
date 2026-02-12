const fetch = require("node-fetch");

module.exports = async (context) => {
  const { client, m, text, prefix } = context;

  if (!text) {
    return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ You braindead waste of space, give me something to work with!\n├ Example: ${prefix}gemini What's 2+2?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }

  if (text.length > 500) {
    return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Do you think I have infinite patience? Keep your rambling under 500 characters!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }

  try {
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

    const encodedText = encodeURIComponent(text);
    const response = await fetch(`https://api-faa.my.id/faa/gemini-ai?text=${encodedText}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${responseText.substring(0, 100)}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', responseText.substring(0, 200));
      throw new Error('API returned garbage instead of JSON');
    }

    if (!data.status || !data.result) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Gemini AI decided your question was too stupid to answer. Try something less brain-damaging.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Gᴇᴍɪɴɪ Rᴇsᴘᴏɴsᴇ ≪───\n├ \n├ ${data.result}\n├\n├ I did all the thinking for you, you're welcome.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

  } catch (error) {
    console.error("Gemini command error:", error);
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    
    let errorMsg = `Gemini crashed harder than your IQ.\n├ Error: ${error.message}`;
    
    if (error.message.includes('garbage instead of JSON')) {
      errorMsg = "Gemini API is returning HTML garbage. The service is probably down or you got rate-limited.";
    } else if (error.message.includes('timeout')) {
      errorMsg = "Gemini took too long to think. Your question must be extra stupid.";
    }
    
    return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ ${errorMsg}\n├ Try again when you're less useless.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
};