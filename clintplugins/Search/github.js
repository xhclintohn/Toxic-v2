module.exports = async (context) => {
  const { client, m, text } = context;

  try {
    if (!text) {
      m.reply(
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
        "│ ❒ ERROR\n" +
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
        "│ 🚫 Please provide a GitHub username!\n" +
        "│ ❒ Example: .github octocat\n" +
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
      );
      return;
    }

    const response = await fetch(`https://api.github.com/users/${text}`);
    const data = await response.json();

    if (!data.login) {
      m.reply(
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
        "│ ❒ ERROR\n" +
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
        "│ ❌ User not found. Please check the username and try again.\n" +
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
      );
      return;
    }

    const pic = `https://github.com/${data.login}.png`;

    const userInfo =
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ GITHUB USER PROFILE\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ 🔖 Username    : " + (data.login || "N/A") + "\n" +
      "│ ♦️ Name        : " + (data.name || "N/A") + "\n" +
      "│ ✨ Bio         : " + (data.bio || "N/A") + "\n" +
      "│ 🏢 Company     : " + (data.company || "N/A") + "\n" +
      "│ 📍 Location    : " + (data.location || "N/A") + "\n" +
      "│ 📧 Email       : " + (data.email || "N/A") + "\n" +
      "│ 📰 Blog        : " + (data.blog || "N/A") + "\n" +
      "│ 🔓 Public Repos: " + (data.public_repos || 0) + "\n" +
      "│ 👪 Followers   : " + (data.followers || 0) + "\n" +
      "│ 🫶 Following   : " + (data.following || 0) + "\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈";

    await client.sendMessage(m.chat, { image: { url: pic }, caption: userInfo }, { quoted: m });
  } catch (e) {
    m.reply(
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ ERROR\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❌ An error occurred: " + e.message + "\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
    );
  }
};