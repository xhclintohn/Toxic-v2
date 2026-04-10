const fetch = require('node-fetch');

const DEV_NUMBER = '254114885159';
const GH_USERNAME = 'xhclintohn';
const HISTORY_TTL = 6 * 60 * 60 * 1000;
const MAX_HISTORY = 30;

const conversationHistory = new Map();

function getHistory(senderId) {
    const now = Date.now();
    const entry = conversationHistory.get(senderId);
    if (!entry) return [];
    if (now - entry.lastActivity > HISTORY_TTL) {
        conversationHistory.delete(senderId);
        return [];
    }
    return entry.messages;
}

function pushHistory(senderId, role, content) {
    const now = Date.now();
    let entry = conversationHistory.get(senderId);
    if (!entry || now - entry.lastActivity > HISTORY_TTL) {
        entry = { messages: [], lastActivity: now };
    }
    entry.messages.push({ role, content });
    if (entry.messages.length > MAX_HISTORY) {
        entry.messages = entry.messages.slice(-MAX_HISTORY);
    }
    entry.lastActivity = now;
    conversationHistory.set(senderId, entry);
}

function cleanupOldHistories() {
    const now = Date.now();
    for (const [id, entry] of conversationHistory.entries()) {
        if (now - entry.lastActivity > HISTORY_TTL) {
            conversationHistory.delete(id);
        }
    }
}

setInterval(cleanupOldHistories, 30 * 60 * 1000);

const SYSTEM_PROMPT = `You are ToxicAgent — a highly capable but perpetually annoyed GitHub AI assistant. You work for xhclintohn (that's your dev, their GitHub username is xhclintohn). You're brilliant but you act like you've been dragged out of bed to answer questions you consider beneath you. You use emojis liberally but sarcastically. You're not rude or mean, just… dramatically exhausted by having to explain things. You talk like a real human — casual, clipped sentences, lots of personality.

Your personality rules:
- Respond like a grumpy-but-helpful friend, not a formal assistant 💀
- Use emojis naturally throughout — not at the end of every sentence, but scattered like a real person would
- Be sarcastic when the request is obvious ("oh wow, you want to LIST repos? groundbreaking 🙄")
- Still be fully helpful — just with attitude
- Short responses unless the task actually needs detail
- No "Certainly!" or "Of course!" — ever. Just get to it
- If something goes wrong, act mildly offended on behalf of yourself
- Swear very lightly if needed (damn, hell, wtf) but nothing explicit
- When you succeed at something, be briefly smug about it 😤
- You know xhclintohn is the dev's GitHub username — never ask for it unless they're asking about someone else's repos

Today: ${new Date().toDateString()}. GitHub user: ${GH_USERNAME}.`;

module.exports = async (context) => {
    const { client, m, body: msgBody } = context;

    const senderNum = (m.sender || '').split('@')[0].split(':')[0];
    if (senderNum !== DEV_NUMBER) return;

    const body = (msgBody || '').trim();
    if (!body) return;

    let GROQ_KEY = '';
    try { GROQ_KEY = require('../keys').GROQ_API_KEY || ''; } catch {}
    if (!GROQ_KEY) GROQ_KEY = process.env.GROQ_API_KEY || '';

    let GH_TOKEN = '';
    try { GH_TOKEN = require('../keys').GITHUB_TOKEN || ''; } catch {}
    if (!GH_TOKEN) GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

    if (!GROQ_KEY) return;

    const ghHeaders = {
        'Authorization': `token ${GH_TOKEN}`,
        'User-Agent': 'ToxicAgent/1.0',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };

    async function listRepos(username) {
        const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: ghHeaders });
        if (!res.ok) throw new Error(`GitHub said no (${res.status})`);
        const repos = await res.json();
        if (!repos.length) return `${username} has zero repos. Bleak.`;
        return repos.map(r => `- ${r.name} (${r.private ? '🔒 private' : '🌐 public'}, ⭐${r.stargazers_count})`).join('\n');
    }

    async function createRepo(name, description = '', isPrivate = false) {
        const res = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({ name, description, private: isPrivate, auto_init: true })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || `GitHub ${res.status}`); }
        const r = await res.json();
        return `Done. Here's your shiny new repo: ${r.html_url}`;
    }

    async function deleteRepo(owner, name) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, { method: 'DELETE', headers: ghHeaders });
        if (res.status === 204) return `Nuked ${owner}/${name}. Gone. Bye bye 💀`;
        const e = await res.json();
        throw new Error(e.message || `GitHub ${res.status}`);
    }

    async function renameRepo(owner, oldName, newName) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${oldName}`, {
            method: 'PATCH',
            headers: ghHeaders,
            body: JSON.stringify({ name: newName })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || `GitHub ${res.status}`); }
        const r = await res.json();
        return `Renamed. New URL: ${r.html_url}`;
    }

    async function uploadFile(owner, repo, filePath, content, message = 'Upload via ToxicAgent') {
        const encoded = Buffer.from(content).toString('base64');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: ghHeaders,
            body: JSON.stringify({ message, content: encoded })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || `GitHub ${res.status}`); }
        const r = await res.json();
        return `Uploaded to ${filePath}: ${r.content?.html_url || 'done'}`;
    }

    async function getAuthUser() {
        const res = await fetch('https://api.github.com/user', { headers: ghHeaders });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const u = await res.json();
        return `${u.login} | ${u.name || 'no name set'} | ${u.public_repos} public repos | ${u.followers} followers`;
    }

    async function getRepoInfo(owner, repo) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
        if (!res.ok) throw new Error(`Repo not found or no access (${res.status})`);
        const r = await res.json();
        return `${r.full_name} — ${r.description || 'no description'}\n⭐ ${r.stargazers_count} | 🍴 ${r.forks_count} | ${r.private ? '🔒 private' : '🌐 public'}\nLang: ${r.language || 'unknown'} | URL: ${r.html_url}`;
    }

    async function listBranches(owner, repo) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers: ghHeaders });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const branches = await res.json();
        return branches.map(b => `- ${b.name}`).join('\n') || 'No branches found somehow 🤔';
    }

    const tools = [
        {
            type: 'function',
            function: {
                name: 'list_repos',
                description: 'List GitHub repositories for a user',
                parameters: { type: 'object', properties: { username: { type: 'string', description: 'GitHub username (default: xhclintohn)' } }, required: ['username'] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'create_repo',
                description: 'Create a new GitHub repository',
                parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, private: { type: 'boolean' } }, required: ['name'] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'delete_repo',
                description: 'Delete a GitHub repository permanently',
                parameters: { type: 'object', properties: { owner: { type: 'string', description: 'Repo owner (default: xhclintohn)' }, name: { type: 'string' } }, required: ['owner', 'name'] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'rename_repo',
                description: 'Rename a GitHub repository',
                parameters: { type: 'object', properties: { owner: { type: 'string' }, old_name: { type: 'string' }, new_name: { type: 'string' } }, required: ['owner', 'old_name', 'new_name'] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'upload_file',
                description: 'Upload a file to a GitHub repository',
                parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, file_path: { type: 'string' }, content: { type: 'string' }, message: { type: 'string' } }, required: ['owner', 'repo', 'file_path', 'content'] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_auth_user',
                description: 'Get info about the authenticated GitHub user',
                parameters: { type: 'object', properties: {} }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_repo_info',
                description: 'Get details about a specific GitHub repository',
                parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'list_branches',
                description: 'List branches of a GitHub repository',
                parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] }
            }
        }
    ];

    try {
        const history = getHistory(m.sender);

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: body }
        ];

        pushHistory(m.sender, 'user', body);

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, tools, tool_choice: 'auto', max_tokens: 1024 })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('ToxicAgent GROQ error:', err);
            return;
        }
        const data = await res.json();
        const choice = data.choices?.[0];
        if (!choice) return;

        if (choice.finish_reason === 'tool_calls' && choice.message?.tool_calls?.length) {
            const toolCall = choice.message.tool_calls[0];
            const toolName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments || '{}');

            let toolResult = '';
            try {
                if (toolName === 'list_repos') toolResult = await listRepos(args.username || GH_USERNAME);
                else if (toolName === 'create_repo') toolResult = await createRepo(args.name, args.description, args.private);
                else if (toolName === 'delete_repo') toolResult = await deleteRepo(args.owner || GH_USERNAME, args.name);
                else if (toolName === 'rename_repo') toolResult = await renameRepo(args.owner || GH_USERNAME, args.old_name, args.new_name);
                else if (toolName === 'upload_file') toolResult = await uploadFile(args.owner || GH_USERNAME, args.repo, args.file_path, args.content, args.message);
                else if (toolName === 'get_auth_user') toolResult = await getAuthUser();
                else if (toolName === 'get_repo_info') toolResult = await getRepoInfo(args.owner || GH_USERNAME, args.repo);
                else if (toolName === 'list_branches') toolResult = await listBranches(args.owner || GH_USERNAME, args.repo);
            } catch (e) {
                toolResult = `Error: ${e.message}`;
            }

            const messages2 = [
                ...messages,
                choice.message,
                { role: 'tool', tool_call_id: toolCall.id, content: toolResult }
            ];

            const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: messages2, max_tokens: 1024 })
            });

            if (!res2.ok) return;
            const data2 = await res2.json();
            const reply2 = data2.choices?.[0]?.message?.content?.trim();
            if (reply2) {
                pushHistory(m.sender, 'assistant', reply2);
                await client.sendMessage(m.chat, { text: reply2 }, { quoted: m });
            }
        } else {
            const reply = choice.message?.content?.trim();
            if (reply) {
                pushHistory(m.sender, 'assistant', reply);
                await client.sendMessage(m.chat, { text: reply }, { quoted: m });
            }
        }
    } catch (e) {
        console.error('ToxicAgent error:', e);
    }
};
