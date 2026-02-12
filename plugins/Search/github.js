const fetch = require('node-fetch');

async function githubUserStalk(user) {
  const response = await fetch('https://api.github.com/users/' + user, {
    headers: {
      'User-Agent': 'Toxic-MD-Bot/1.0',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    username: data.login,
    name: data.name,
    bio: data.bio,
    id: data.id,
    profile_pic: data.avatar_url,
    html_url: data.html_url,
    type: data.type,
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
}

async function githubRepoSearch(query) {
  const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=1`, {
    headers: {
      'User-Agent': 'Toxic-MD-Bot/1.0',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.total_count === 0) {
    throw new Error('No repository found');
  }

  const repo = data.items[0];
  return {
    type: 'repository',
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    owner: repo.owner.login,
    owner_url: repo.owner.html_url,
    owner_avatar: repo.owner.avatar_url,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    watchers_count: repo.watchers_count,
    open_issues_count: repo.open_issues_count,
    size: formatSize(repo.size),
    language: repo.language,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    license: repo.license?.name || 'No license',
    default_branch: repo.default_branch
  };
}

async function githubUserSearch(query) {
  const response = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=1`, {
    headers: {
      'User-Agent': 'Toxic-MD-Bot/1.0',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.total_count === 0) {
    throw new Error('No user found');
  }

  const user = data.items[0];
  return {
    type: 'user',
    username: user.login,
    html_url: user.html_url,
    avatar_url: user.avatar_url,
    score: user.score
  };
}

function formatSize(size) {
  if (size < 1024) return size + ' KB';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' MB';
  return (size / (1024 * 1024)).toFixed(1) + ' GB';
}

async function getBuffer(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

module.exports = async (context) => {
  const { client, m, text } = context;

  try {
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

    if (!text) {
      return m.reply(`╭───(    TOXIC-MD    )───\n├ please provide a github username or repo\n├ example: .github octocat\n├ example: .github node.js\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    let result;
    let isUser = false;
    let isRepo = false;

    try {
      result = await githubUserStalk(text);
      isUser = true;
    } catch {
      try {
        result = await githubRepoSearch(text);
        isRepo = true;
      } catch {
        try {
          const userResult = await githubUserSearch(text);
          if (userResult) {
            const detailedUser = await githubUserStalk(userResult.username);
            result = detailedUser;
            isUser = true;
          }
        } catch {
          throw new Error('not found on github');
        }
      }
    }

    await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    let caption = '';
    let thumb = null;

    if (isUser) {
      thumb = await getBuffer(result.profile_pic);
      caption = `╭───(    TOXIC-MD    )───\n` +
                `├ github user profile\n` +
                `╭───(    TOXIC-MD    )───\n` +
                `│🔖 username: ${result.username || 'n/a'}\n` +
                `│♦️ name: ${result.name || 'n/a'}\n` +
                `│✨ bio: ${result.bio || 'n/a'}\n` +
                `│🏢 company: ${result.company || 'n/a'}\n` +
                `│📍 location: ${result.location || 'n/a'}\n` +
                `│👥 followers: ${result.followers || 0}\n` +
                `│🫶 following: ${result.following || 0}\n` +
                `│📦 repos: ${result.public_repo || 0}\n` +
                `│📝 gists: ${result.public_gists || 0}\n` +
                `│📧 email: ${result.email || 'private'}\n` +
                `│🔗 profile: ${result.html_url}\n` +
                `╭───(    TOXIC-MD    )───\n` +
                `├ 𝐓𝐨𝐱𝐢𝐜-𝐌D\n` +
                `╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

    } else if (isRepo) {
      thumb = await getBuffer(result.owner_avatar);
      caption = `╭───(    TOXIC-MD    )───\n` +
                `├ github repository\n` +
                `╭───(    TOXIC-MD    )───\n` +
                `│📦 repo: ${result.full_name}\n` +
                `│📝 description: ${result.description || 'no description'}\n` +
                `│👤 owner: ${result.owner}\n` +
                `│⭐ stars: ${result.stargazers_count}\n` +
                `│🍴 forks: ${result.forks_count}\n` +
                `│👀 watchers: ${result.watchers_count}\n` +
                `│🐛 issues: ${result.open_issues_count}\n` +
                `│📏 size: ${result.size}\n` +
                `│💻 language: ${result.language || 'not specified'}\n` +
                `│📄 license: ${result.license}\n` +
                `│🌿 branch: ${result.default_branch}\n` +
                `│🔗 url: ${result.html_url}\n` +
                `╭───(    TOXIC-MD    )───\n` +
                `├ 𝐓𝐨𝐱𝐢𝐜-𝐌D\n` +
                `╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    }

    if (thumb) {
      await client.sendMessage(m.chat, { image: thumb, caption: caption }, { quoted: m });
    } else {
      await client.sendMessage(m.chat, { text: caption }, { quoted: m });
    }

  } catch (error) {
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    
    let errorMessage = 'failed to search github';
    if (error.message.includes('not found')) errorMessage = 'not found on github';
    if (error.message.includes('rate limit')) errorMessage = 'rate limit exceeded';
    
    await m.reply(`╭───(    TOXIC-MD    )───\n├ ${errorMessage}\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
};