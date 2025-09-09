module.exports = async (context) => {
  const { client, m, text } = context;
  const axios = require("axios");

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
  };

  // Check if text is provided
  if (!text) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Yo, fam, give me something to chat about! 🗣️ Ex: .gemini What's good?") },
      { quoted: m, ad: true }
    );
  }

  // Limit input length
  if (text.length > 500) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Chill, homie! Keep it under 500 chars. 📝") },
      { quoted: m, ad: true }
    );
  }

  try {
    // Hit the Gemini API
    const { data } = await axios.get("https://api.giftedtech.co.ke/api/ai/geminiai", {
      params: { apikey: "gifted", q: text },
      headers: { Accept: "application/json" },
      timeout: 10000,
    });

    // Check if response is valid
    if (!data.success || !data.result) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("API’s acting shady, no response! 😢 Try again.") },
        { quoted: m, ad: true }
      );
    }

    // Send the response
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(data.result) },
      { quoted: m, ad: true }
    );
  } catch (error) {
    console.error("Gemini command error:", error);
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Yo, something broke: ${error.message}. Try another query! 😎`) },
      { quoted: m, ad: true }
    );
  }
};