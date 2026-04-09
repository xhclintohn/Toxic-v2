const fetch = require('node-fetch');

const DEV_NUMBER = '254114885159';

module.exports = async (context) => {
    const { client, m, settings } = context;

    const senderNum = (m.sender || '').split('@')[0].split(':')[0];
    if (senderNum !== DEV_NUMBER) return;
    if (!(settings.toxicai === true || settings.toxicai === 'true')) return;

    const body = (m.body || '').trim();
    if (!body) return;

    const GROQ_KEY = process.env.GROQ_API_KEY || (() => { try { return require('../keys').GROQ_API_KEY; } catch { return ''; } })();
    const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || (() => { try { return require('../keys').GITHUB_TOKEN; } catch { return ''; } })();

    if (!GROQ_KEY) return;

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const systemPrompt = `You are ToxicAI, a GitHub management agent for xhclintohn (developer of Toxic-MD).
Analyze the developer's request and respond with ONLY valid JSON.

AVAILABLE ACTIONS:
{"action":"LIST_REPOS"}
{"action":"CREATE_REPO","name":"repo-name","private":true,"description":"optional"}
{"action":"DELETE_REPO","repo":"repo-name"}
{"action":"RENAME_REPO","repo":"old-name","new_name":"new-name"}
{"action":"UPLOAD_FILE","repo":"repo-name","path":"file/path.ext","content":"file content here","message":"commit msg"}
{"action":"REPO_INFO","repo":"repo-name"}
{"action":"CHAT","reply":"your response"}

Use CHAT for non-GitHub requests. Output ONLY the JSON, nothing else.`;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: body }
                ],
                max_tokens: 600,
                temperature: 0.1
            })
        });

        if (!res.ok) throw new Error(`Groq error: ${res.status}`);

        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content?.trim();
        if (!rawContent) throw new Error('No AI response');

        let parsed;
        try {
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
        } catch {
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: rawContent }, { quoted: m });
            return;
        }

        const { action } = parsed;

        if (action === 'CHAT') {
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: parsed.reply || 'Done.' }, { quoted: m });
            return;
        }

        if (!GH_TOKEN) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await client.sendMessage(m.chat, { text: '❌ GITHUB_TOKEN not set in environment variables.' }, { quoted: m });
            return;
        }

        const ghHeaders = {
            'Authorization': `Bearer ${GH_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Toxic-MD-Bot/2.0'
        };

        const ghFetch = async (path, method = 'GET', body = null) => {
            const r = await fetch(`https://api.github.com${path}`, {
                method,
                headers: ghHeaders,
                ...(body ? { body: JSON.stringify(body) } : {})
            });
            if (!r.ok && r.status !== 404) throw new Error(`GitHub API: ${r.status} ${await r.text().then(t => t.slice(0, 80))}`);
            return r.status === 204 ? null : r.json();
        };

        const userInfo = await ghFetch('/user');
        const owner = userInfo.login;

        if (action === 'LIST_REPOS') {
            const repos = await ghFetch('/user/repos?per_page=30&sort=updated');
            const list = repos.map((r, i) => `${i + 1}. ${r.name} (${r.private ? '🔒 private' : '🌐 public'})`).join('\n');
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├───≫ Your Repos ≪───\n├ \n${list}\n╰──────────────────☉` }, { quoted: m });

        } else if (action === 'CREATE_REPO') {
            const repo = await ghFetch('/user/repos', 'POST', {
                name: parsed.name,
                private: parsed.private !== false,
                description: parsed.description || '',
                auto_init: true
            });
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├───≫ Repo Created ≪───\n├ \n├ Name: ${repo.name}\n├ URL: ${repo.html_url}\n├ Visibility: ${repo.private ? 'Private 🔒' : 'Public 🌐'}\n╰──────────────────☉` }, { quoted: m });

        } else if (action === 'DELETE_REPO') {
            await ghFetch(`/repos/${owner}/${parsed.repo}`, 'DELETE');
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├ Repo "${parsed.repo}" deleted. Gone forever.\n╰──────────────────☉` }, { quoted: m });

        } else if (action === 'RENAME_REPO') {
            const repo = await ghFetch(`/repos/${owner}/${parsed.repo}`, 'PATCH', { name: parsed.new_name });
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├ Renamed → ${repo.name}\n├ URL: ${repo.html_url}\n╰──────────────────☉` }, { quoted: m });

        } else if (action === 'UPLOAD_FILE') {
            const content = Buffer.from(parsed.content || '').toString('base64');
            let sha;
            try {
                const existing = await ghFetch(`/repos/${owner}/${parsed.repo}/contents/${parsed.path}`);
                if (existing && existing.sha) sha = existing.sha;
            } catch {}
            await ghFetch(`/repos/${owner}/${parsed.repo}/contents/${parsed.path}`, 'PUT', {
                message: parsed.message || `Update ${parsed.path}`,
                content,
                ...(sha ? { sha } : {})
            });
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├ Uploaded: ${parsed.path}\n├ Repo: ${parsed.repo}\n╰──────────────────☉` }, { quoted: m });

        } else if (action === 'REPO_INFO') {
            const repo = await ghFetch(`/repos/${owner}/${parsed.repo}`);
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├───≫ Repo Info ≪───\n├ \n├ Name: ${repo.name}\n├ Stars: ${repo.stargazers_count}\n├ Forks: ${repo.forks_count}\n├ Language: ${repo.language || 'N/A'}\n├ URL: ${repo.html_url}\n╰──────────────────☉` }, { quoted: m });

        } else {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await client.sendMessage(m.chat, { text: `Unknown action: ${action}` }, { quoted: m });
        }

    } catch (error) {
        console.error('[TOXICAI] Error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├ ToxicAI Error: ${error.message}\n╰──────────────────☉` }, { quoted: m });
    }
};
