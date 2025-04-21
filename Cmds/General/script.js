module.exports = async (context) => {
    const { client, m, pict } = context;

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

        const caption = `📂 *𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 Repository*\n\n` +
                       `🌟 *Stars*: ${repoInfo.stars}\n` +
                       `🔗 *Forks*: ${repoInfo.forks}\n` +
                       `📅 *Created*: ${createdDate}\n` +
                       `🕒 *Last Updated*: ${lastUpdateDate}\n` +
                       `👤 *Owner*: ${repoInfo.owner}\n` +
                       `🔍 *Visit*: ${repoInfo.htmlUrl}\n\n` +
                       `◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐓𝐎XIC-𝐌𝐃 𝐕3*`;

        await client.sendMessage(m.chat, {
            image: { url: pict }, // Use context-provided pict
            caption: caption
        }, { quoted: m });
    } catch (error) {
        console.error('Error in repo command:', error);
        await client.sendMessage(m.chat, {
            text: `⚠️ *Oops! Failed to fetch repo info:* ${error.message}\n\nVisit https://github.com/xhclintohn/Toxic-v2 for details!`
        }, { quoted: m });
    }
};