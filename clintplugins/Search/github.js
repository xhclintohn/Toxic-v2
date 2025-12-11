const fetch = require('node-fetch');

async function githubstalk(user) {
  return new Promise((resolve, reject) => {
    fetch('https://api.github.com/users/' + user)
      .then(async (response) => {
        const text = await response.text();
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          reject(new Error('GitHub API returned HTML page'));
          return;
        }
        const data = JSON.parse(text);
        let hasil = {
          username: data.login,
          name: data.name,
          bio: data.bio,
          id: data.id,
          nodeId: data.node_id,
          profile_pic: data.avatar_url,
          html_url: data.html_url,
          type: data.type,
          admin: data.site_admin,
          company: data.company,
          blog: data.blog,
          location: data.location,
          email: data.email,
          public_repo: data.public_repos,
          public_gists: data.public_gists,
          followers: data.followers,
          following: data.following,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        resolve(hasil);
      })
      .catch(error => {
        reject(error);
      });
  });
}

async function getBuffer(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching buffer:', error);
    return null;
  }
}

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

    const request = await githubstalk(text);
    const {
      username,
      following,
      followers,
      type,
      bio,
      company,
      blog,
      location,
      email,
      public_repo,
      public_gists,
      profile_pic,
      created_at,
      updated_at,
      html_url,
      name
    } = request;

    const thumb = await getBuffer(profile_pic);
    if (!thumb) {
      return m.reply('Failed to fetch profile picture.');
    }

    const userInfo =
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ GITHUB USER PROFILE\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ 🔖 Username    : " + (username || "N/A") + "\n" +
      "│ ♦️ Name        : " + (name || "N/A") + "\n" +
      "│ ✨ Bio         : " + (bio || "N/A") + "\n" +
      "│ 🏢 Company     : " + (company || "N/A") + "\n" +
      "│ 📍 Location    : " + (location || "N/A") + "\n" +
      "│ 📧 Email       : " + (email || "N/A") + "\n" +
      "│ 📰 Blog        : " + (blog || "N/A") + "\n" +
      "│ 🔓 Public Repos: " + (public_repo || 0) + "\n" +
      "│ 👪 Followers   : " + (followers || 0) + "\n" +
      "│ 🫶 Following   : " + (following || 0) + "\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈";

    await client.sendMessage(m.chat, { image: thumb, caption: userInfo }, { quoted: m });
  } catch (e) {
    m.reply(
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ ERROR\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❌ " + e.message + "\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
    );
  }
};