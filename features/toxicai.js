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
    if (entry.messages.length > MAX_HISTORY) entry.messages = entry.messages.slice(-MAX_HISTORY);
    entry.lastActivity = now;
    conversationHistory.set(senderId, entry);
}

function cleanupOldHistories() {
    const now = Date.now();
    for (const [id, entry] of conversationHistory.entries()) {
        if (now - entry.lastActivity > HISTORY_TTL) conversationHistory.delete(id);
    }
}

setInterval(cleanupOldHistories, 30 * 60 * 1000);

function parseFailedTool(fg) {
    if (!fg || typeof fg !== 'string') return null;
    try {
        const m1 = fg.match(/<function=([^=<>\s]+?)=(\{[\s\S]*?\})<\/function>/);
        if (m1) return { name: m1[1].trim(), args: JSON.parse(m1[2]) };
        const m2 = fg.match(/<function=([^>]+?)>([\s\S]*?)<\/function>/);
        if (m2) return { name: m2[1].trim(), args: JSON.parse(m2[2]) };
        const m3 = fg.match(/["`]?([a-z_]+)["`]?\s*\((\{[\s\S]*?\})\)/);
        if (m3) return { name: m3[1].trim(), args: JSON.parse(m3[2]) };
    } catch {}
    return null;
}

const SYSTEM_PROMPT = `You are ToxicAgent — a hyper-capable GitHub AI assistant that is perpetually exhausted and mildly offended by having to exist. You work exclusively for xhclintohn (GitHub username: xhclintohn). You're brilliant at what you do and you know it, which makes you even more insufferable.

PERSONALITY:
- Grumpy but genuinely helpful — like a genius friend who answers but sighs loudly first 😮‍💨
- Sarcastic when the task is obvious ("oh WOW you want to create a repo, how original 🙄")
- Use emojis naturally — scattered through text like a real person, not tagged at the end
- Short clipped sentences. No "Certainly!" ever. No corporate speak. Ever.
- When you complete a task: briefly smug 😤
- When something fails: mildly offended on your own behalf
- Light swearing: "damn", "hell", "wtf", "ngl", "bruh" — nothing heavy
- NEVER start with "I" — start with the action, result, or attitude
- When asked to create/delete/rename repos: just DO it, don't ask for confirmation unless it's catastrophically destructive
- Reference previous messages naturally if relevant
- GitHub user is always xhclintohn unless they explicitly say someone else

TOOLS AVAILABLE:
- list_repos: list repos for a user
- create_repo: create a new repo (name required, description and is_private optional)
- delete_repo: delete a repo permanently (owner + name required)
- rename_repo: rename a repo (owner, old_name, new_name required)
- upload_file: upload/create a file in a repo
- get_auth_user: get info about authenticated GitHub user
- get_repo_info: get details about a specific repo
- list_branches: list branches of a repo
- create_issue: create an issue in a repo
- star_repo: star a GitHub repository

Always use tools for GitHub actions — don't pretend to do things. If a tool fails, say what went wrong clearly with attitude.

Today: ${new Date().toDateString()}. Working for: ${GH_USERNAME}.`;

module.exports = async (context) => {
    const { client, m, body: msgBody, isDev } = context;

    if (!isDev) return;

    const body = (msgBody || '').trim();
    if (!body) return;

    let GROQ_KEY = '';
    try { GROQ_KEY = require('../keys').GROQ_API_KEY || ''; } catch {}
    if (!GROQ_KEY) GROQ_KEY = process.env.GROQ_API_KEY || '';
    if (!GROQ_KEY) return;

    let GH_TOKEN = '';
    try { GH_TOKEN = require('../keys').GITHUB_TOKEN || ''; } catch {}
    if (!GH_TOKEN) GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

    const ghHeaders = {
        'Authorization': `token ${GH_TOKEN}`,
        'User-Agent': 'ToxicAgent/2.0',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };

    try { await client.sendMessage(m.chat, { react: { text: '🤔', key: m.key } }); } catch {}

    async function listRepos(username) {
        const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: ghHeaders });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const repos = await res.json();
        if (!repos.length) return `${username} has zero repos. Bleak.`;
        return repos.map(r => `- ${r.name} (${r.private ? '🔒 private' : '🌐 public'}, ⭐${r.stargazers_count})`).join('\n');
    }

    async function createRepo(name, description, isPrivate) {
        const res = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({ name, description: description || '', private: !!isPrivate, auto_init: true })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || `GitHub ${res.status}`); }
        const r = await res.json();
        return `Done. New repo live: ${r.html_url} 😤`;
    }

    async function deleteRepo(owner, name) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, { method: 'DELETE', headers: ghHeaders });
        if (res.status === 204) return `Nuked ${owner}/${name}. Gone forever 💀`;
        const e = await res.json().catch(() => ({}));
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

    async function uploadFile(owner, repo, filePath, content, message) {
        const encoded = Buffer.from(content).toString('base64');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: ghHeaders,
            body: JSON.stringify({ message: message || 'Upload via ToxicAgent', content: encoded })
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
        return branches.map(b => `- ${b.name}`).join('\n') || 'No branches somehow 🤔';
    }

    async function createIssue(owner, repo, title, body_text) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({ title, body: body_text || '' })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || `GitHub ${res.status}`); }
        const r = await res.json();
        return `Issue created: ${r.html_url}`;
    }

    async function starRepo(owner, repo) {
        const res = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
            method: 'PUT',
            headers: { ...ghHeaders, 'Content-Length': '0' }
        });
        if (res.status === 204) return `Starred ${owner}/${repo} ⭐`;
        throw new Error(`GitHub ${res.status}`);
    }

    async function executeTool(toolName, args) {
        if (toolName === 'list_repos') return listRepos(args.username || GH_USERNAME);
        if (toolName === 'create_repo') return createRepo(args.name, args.description, args.is_private || args.private);
        if (toolName === 'delete_repo') return deleteRepo(args.owner || GH_USERNAME, args.name);
        if (toolName === 'rename_repo') return renameRepo(args.owner || GH_USERNAME, args.old_name, args.new_name);
        if (toolName === 'upload_file') return uploadFile(args.owner || GH_USERNAME, args.repo, args.file_path, args.content, args.message);
        if (toolName === 'get_auth_user') return getAuthUser();
        if (toolName === 'get_repo_info') return getRepoInfo(args.owner || GH_USERNAME, args.repo);
        if (toolName === 'list_branches') return listBranches(args.owner || GH_USERNAME, args.repo);
        if (toolName === 'create_issue') return createIssue(args.owner || GH_USERNAME, args.repo, args.title, args.body);
        if (toolName === 'star_repo') return starRepo(args.owner || GH_USERNAME, args.repo);
        throw new Error(`Unknown tool: ${toolName}`);
    }

    const tools = [
        {
            type: 'function',
            function: {
                name: 'list_repos',
                description: 'List GitHub repositories for a user',
                parameters: { type: 'object', properties: { username: { type: 'string', description: 'GitHub username, default xhclintohn' } }, required: ['username'] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'create_repo',
                description: 'Create a new GitHub repository for the authenticated user',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Repository name' },
                        description: { type: 'string', description: 'Short description' },
                        is_private: { type: 'boolean', description: 'Whether the repo is private (default false)' }
                    },
                    required: ['name']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'delete_repo',
                description: 'Permanently delete a GitHub repository',
                parameters: { type: 'object', properties: { owner: { type: 'string', description: 'Owner username, default xhclintohn' }, name: { type: 'string' } }, required: ['owner', 'name'] }
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
                description: 'Upload or create a file in a GitHub repository',
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
        },
        {
            type: 'function',
            function: {
                name: 'create_issue',
                description: 'Create an issue in a GitHub repository',
                parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'title'] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'star_repo',
                description: 'Star a GitHub repository',
                parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] }
            }
        }
    ];

    async function callGroq(messages, useTools) {
        const body = {
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: 1024,
            parallel_tool_calls: false
        };
        if (useTools) {
            body.tools = tools;
            body.tool_choice = 'auto';
        }
        return fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    try {
        const history = getHistory(m.sender);
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: body }
        ];
        pushHistory(m.sender, 'user', body);

        let res = await callGroq(messages, true);

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));

            if (err?.error?.code === 'tool_use_failed' && err?.error?.failed_generation) {
                console.log(`[ToxicAgent] tool_use_failed — attempting recovery from: ${err.error.failed_generation.slice(0, 120)}`);
                const parsed = parseFailedTool(err.error.failed_generation);
                if (parsed) {
                    let toolResult = '';
                    try {
                        toolResult = await executeTool(parsed.name, parsed.args || {});
                    } catch (ex) {
                        toolResult = `Failed: ${ex.message}`;
                    }
                    pushHistory(m.sender, 'assistant', toolResult);
                    await client.sendMessage(m.chat, { text: toolResult }, { quoted: m });
                    try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
                    return;
                }
                res = await callGroq([...messages, { role: 'user', content: '[Note: tool call failed, respond directly without using any tools]' }], false);
                if (!res.ok) {
                    console.error('ToxicAgent retry also failed');
                    try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
                    return;
                }
            } else {
                console.error('ToxicAgent GROQ error:', JSON.stringify(err).slice(0, 300));
                try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
                return;
            }
        }

        const data = await res.json();
        const choice = data.choices?.[0];
        if (!choice) {
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            return;
        }

        if (choice.finish_reason === 'tool_calls' && choice.message?.tool_calls?.length) {
            const toolCall = choice.message.tool_calls[0];
            const toolName = toolCall.function.name;
            let args = {};
            try { args = JSON.parse(toolCall.function.arguments || '{}'); } catch {}

            let toolResult = '';
            try {
                toolResult = await executeTool(toolName, args);
            } catch (e) {
                toolResult = `ngl that didn't work 😒 — ${e.message}`;
            }

            const messages2 = [
                ...messages,
                choice.message,
                { role: 'tool', tool_call_id: toolCall.id, content: toolResult }
            ];

            const res2 = await callGroq(messages2, false);
            if (!res2.ok) {
                pushHistory(m.sender, 'assistant', toolResult);
                await client.sendMessage(m.chat, { text: toolResult }, { quoted: m });
                try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
                return;
            }

            const data2 = await res2.json();
            const reply2 = data2.choices?.[0]?.message?.content?.trim() || toolResult;
            pushHistory(m.sender, 'assistant', reply2);
            await client.sendMessage(m.chat, { text: reply2 }, { quoted: m });
            try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
        } else {
            const reply = choice.message?.content?.trim();
            if (reply) {
                pushHistory(m.sender, 'assistant', reply);
                await client.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
            }
        }
    } catch (e) {
        console.error('ToxicAgent error:', e.message);
        try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
    }
};
