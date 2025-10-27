/**
 * Fetches and displays Toxic-MD repository information from GitHub.
 * @module repo
 */
module.exports = {
  name: 'repo',
  aliases: ['repository', 'github'],
  description: 'Displays Toxic-MD repository details with a link to contact the developer',
  run: async (context) => {
    const { client, m, text, botname, prefix = '' } = context;

    /**
     * Converts text to a fancy font for display.
     * @param {string} text - The text to convert.
     * @param {boolean} [isUpperCase=false] - Whether to convert to uppercase.
     * @returns {string} The text in fancy font.
     */
    const toFancyFont = (text, isUpperCase = false) => {
      const fonts = {
        'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
        'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
        'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
        'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
      };
      return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
        .split('')
        .map(char => fonts[char] || char)
        .join('');
    };

    /**
     * Checks for invalid input text.
     */
    if (text) {
      return client.sendMessage(m.chat, { 
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, what’s with the extra garbage? Just say ${prefix}repo, you idiot.` 
      }, { quoted: m });
    }

    try {
      /**
       * Fetches repository data from GitHub API.
       */
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
        htmlUrl: repoData.htmlUrl
      };

      const createdDate = new Date(repoInfo.createdAt).toLocaleDateString('en-GB');
      const lastUpdateDate = new Date(repoInfo.lastUpdate).toLocaleDateString('en-GB');

      /**
       * Constructs the reply message with repository details.
       */
      const replyText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *${botname} Repo*\n\n` +
                       `🌟 *Sƚαɾʂ*: ${repoInfo.stars} (y’all better star)\n` +
                       `🔗 *Fσɾƙʂ*: ${repoInfo.forks} (do fork)\n` +
                       `📅 *Cɾҽαƚҽԃ*: ${createdDate} (born to rule)\n` +
                       `🕒 *Lαʂƚ Uρԃαƚҽԃ*: ${lastUpdateDate} (still fresh)\n` +
                       `👤 *Oɯɳҽɾ*: ${repoInfo.owner} (that’s me)\n` +
                       `🔍 *Vιʂιƚ*: ${repoInfo.htmlUrl} (check the repo)\n\n` +
                       `│❒ Wanna know the genius behind this? Hit the button below!`;

      /**
       * Sends the repository info with a CTA button to contact the developer.
       */
      await client.sendMessage(m.chat, {
        text: replyText,
        footer: `Pσɯҽɾҽԃ Ⴆყ ${botname}`,
        buttons: [
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: `👤 ${toFancyFont('Contact Dev')}`,
              url: 'https://wa.me/254735342808?text=Hi+Toxic+Dev',
              merchant_url: 'https://wa.me/254735342808?text=Hi+Toxic+Dev'
            })
          }
        ],
        headerType: 1,
        viewOnce: true,
        contextInfo: {
          externalAdReply: {
            showAdAttribution: false,
            title: `${botname}`,
            body: `Yo! Don’t fuck this up.`,
            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });
    } catch (error) {
      console.error('Error in repo command:', error);
      await client.sendMessage(m.chat, { 
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Couldn’t grab repo info, something’s fucked up. Check it yourself: https://github.com/xhclintohn/Toxic-MD` 
      }, { quoted: m });
    }
  }
};