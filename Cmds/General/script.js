module.exports = async (context) => {
  const { client, m, text, botname } = context;

  if (text) {
    return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, what’s with the extra garbage? Just say !repo, you idiot.` }, { quoted: m });
  }

  try {
    const repoUrl = 'https://api.github.com/repos/xhclintohn/Toxic-MD';
    const response = await fetch(repoUrl);
    const repoData = await response.json();

    if (!response.ok) {
      throw new Error('Failed to fetch repository data');
    }

    const repoInfo = {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      lastUpdate: repoData.updated_at,
      owner: repoData.owner.login,
      createdAt: repoData.created_at,
      htmlUrl: repoData.html_url
    };

    const createdDate = new Date(repoInfo.createdAt).toLocaleDateString('en-GB');
    const lastUpdateDate = new Date(repoInfo.lastUpdate).toLocaleDateString('en-GB');

    const replyText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *${botname} Repo, Bitches*\n\n` +
                     `🌟 *Stars*: ${repoInfo.stars} (y’all better star this shit)\n` +
                     `🔗 *Forks*: ${repoInfo.forks} (steal it, I dare you)\n` +
                     `📅 *Created*: ${createdDate} (born to rule)\n` +
                     `🕒 *Last Updated*: ${lastUpdateDate} (still fresh)\n` +
                     `👤 *Owner*: ${repoInfo.owner} (that’s me, bow down)\n` +
                     `🔍 *Visit*: ${repoInfo.htmlUrl} (check my empire)\n\n` +
                     `PoweredPinned by *${botname}*`;

    await client.sendMessage(m.chat, { text: replyText }, { quoted: m });
  } catch (error) {
    console.error('Error in repo command:', error);
    await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Couldn’t grab repo info, something’s fucked up. Check it yourself: https://github.com/xhclintohn/Toxic-MD` }, { quoted: m });
  }
};