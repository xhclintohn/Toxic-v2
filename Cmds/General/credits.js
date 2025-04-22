module.exports = async (context) => {
  const { client, m, prefix, text } = context;

  if (text) {
    return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, what’s with the extra bullshit? Just say ${prefix}credits, you moron.` }, { quoted: m });
  }

  try {
    const replyText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Credits, Bitches*\n\nAll hail *𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧*, the badass who built this bot from the ground up. Nobody else gets credit—fuck ‘em. This is my empire, and I run this shit solo.\n\nBow down to *𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧* 🫡`;

    await client.sendMessage(m.chat, { text: replyText }, { quoted: m });
  } catch (error) {
    console.error('Error in credits command:', error);
    await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit went sideways, can’t show credits. Try again later, loser.` }, { quoted: m });
  }
};