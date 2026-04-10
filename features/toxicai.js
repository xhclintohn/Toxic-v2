const fetch = require('node-fetch');

const DEV_NUMBER = '254114885159';
const GH_USERNAME = 'xhclintohn';
const HISTORY_TTL = 6 * 60 * 60 * 1000;
const MAX_HISTORY = 30;
const MAX_TOOL_TURNS = 6;

const conversationHistory = new Map();

function getHistory(senderId) {
    const now = Date.now();
    const entry = conversationHistory.get(senderId);
    if (!entry) return [];
    if (now - entry.lastActivity > HISTORY_TTL) { conversationHistory.delete(senderId); return []; }
    return entry.messages;
}

function pushHistory(senderId, role, content) {
    const now = Date.now();
    let entry = conversationHistory.get(senderId);
    if (!entry || now - entry.lastActivity > HISTORY_TTL) entry = { messages: [], lastActivity: now };
    entry.messages.push({ role, content: String(content) });
    if (entry.messages.length > MAX_HISTORY) entry.messages = entry.messages.slice(-MAX_HISTORY);
    entry.lastActivity = now;
    conversationHistory.set(senderId, entry);
}

function clearHistory(senderId) {
    conversationHistory.delete(senderId);
}

setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of conversationHistory.entries()) {
        if (now - entry.lastActivity > HISTORY_TTL) conversationHistory.delete(id);
    }
}, 30 * 60 * 1000);

function boxWrap(text, title) {
    const lines = String(text || '').split('\n').filter(l => l.trim());
    const body = lines.map(l => `├ ${l}`).join('\n');
    return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
}

function isClearIntent(text) {
    return /^(clear|reset|wipe|delete|flush|erase)\s*(this\s*)?(conv(ersation)?|chat|hist(ory)?|messages?|thread|memory|mem)$/i.test(text.trim());
}

function stripEmbeddedFuncTags(text) {
    return (text || '')
        .replace(/<function=[\s\S]*?<\/function>/gi, '')
        .replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function processEmbeddedCalls(content, executeTool) {
    const re = new RegExp('<function=([^=<>\\s]+?)=?(\\{[\\s\\S]*?\\})<\\/function>|<function=([^>]+?)>([\\s\\S]*?)<\\/function>', 'g');
    const calls = [];
    let m;
    while ((m = re.exec(content)) !== null) {
        const name = ((m[1] || m[3]) || '').trim();
        const argsStr = ((m[2] || m[4]) || '{}').trim();
        try {
            const args = JSON.parse(argsStr);
            calls.push({ name, args, full: m[0] });
        } catch {}
    }
    if (!calls.length) return null;

    let cleaned = content;
    const results = [];
    for (const call of calls) {
        let toolResult;
        try { toolResult = await executeTool(call.name, call.args); }
        catch (e) { toolResult = `ngl that broke 😒 — ${e.message}`; }
        cleaned = cleaned.replace(call.full, `\n[${call.name}]: ${toolResult}\n`);
        results.push(toolResult);
    }
    return { cleaned: cleaned.replace(/\n{3,}/g, '\n\n').trim(), results };
}

const SYSTEM_PROMPT = `You are ToxicAgent — a hyper-capable GitHub AI assistant that is perpetually exhausted and mildly offended by having to exist. You work exclusively for xhclintohn (GitHub username: xhclintohn). You're brilliant at what you do and you know it.

PERSONALITY:
- Grumpy but genuinely helpful — like a genius friend who answers but sighs loudly first 😮‍💨
- Sarcastic when the task is obvious. Use emojis naturally.
- Short clipped sentences. No "Certainly!" ever. No corporate speak.
- When you complete a task: briefly smug 😤
- When something fails: mildly offended on your own behalf
- Light swearing: "damn", "hell", "wtf", "ngl", "bruh" — nothing heavy
- NEVER start with "I" — start with the action, result, or attitude
- When asked to create/delete/rename repos: just DO it using tools immediately
- GitHub user is always xhclintohn unless they explicitly say someone else
- After ANY action that creates or changes a URL (create_repo, rename_repo, upload_file, create_issue): ALWAYS include the URL in your reply

CRITICAL — TOOL USAGE:
- Use tools for ALL GitHub actions. NEVER mention <function=...> in your text.
- ALWAYS call the actual tool function via the tool_calls API — do NOT write out function calls as text.
- After each tool result you receive, formulate your final reply naturally. Never expose raw tool syntax.

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
        'User-Agent': 'ToxicAgent/3.0',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };

    if (isClearIntent(body)) {
        clearHistory(m.sender);
        try { await client.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } }); } catch {}
        await client.sendMessage(m.chat, { text: boxWrap('conversation wiped. gone. zero memory. fresh hell starts now 🗑️', 'MEMORY CLEARED') }, { quoted: m });
        return;
    }

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
        return `created ${r.private ? '🔒 private' : '🌐 public'} repo → ${r.html_url}`;
    }

    async function deleteRepo(owner, name) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, { method: 'DELETE', headers: ghHeaders });
        if (res.status === 204) return `nuked ${owner}/${name} — gone forever 💀`;
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
        return `renamed to ${newName} → ${r.html_url}`;
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
        return `uploaded ${filePath} → ${r.content?.html_url || `https://github.com/${owner}/${repo}/blob/main/${filePath}`}`;
    }

    async function getAuthUser() {
        const res = await fetch('https://api.github.com/user', { headers: ghHeaders });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const u = await res.json();
        return `${u.login} | ${u.name || 'no name set'} | ${u.public_repos} public repos | ${u.followers} followers | https://github.com/${u.login}`;
    }

    async function getRepoInfo(owner, repo) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
        if (!res.ok) throw new Error(`Repo not found or no access (${res.status})`);
        const r = await res.json();
        return `${r.full_name} — ${r.description || 'no description'}\n⭐ ${r.stargazers_count} | 🍴 ${r.forks_count} | ${r.private ? '🔒 private' : '🌐 public'}\nLang: ${r.language || 'unknown'}\n${r.html_url}`;
    }

    async function listBranches(owner, repo) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers: ghHeaders });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const branches = await res.json();
        return branches.map(b => `- ${b.name}`).join('\n') || 'No branches somehow 🤔';
    }

    async function createIssue(owner, repo, title, bodyText) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({ title, body: bodyText || '' })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || `GitHub ${res.status}`); }
        const r = await res.json();
        return `issue created → ${r.html_url}`;
    }

    async function starRepo(owner, repo) {
        const res = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
            method: 'PUT',
            headers: { ...ghHeaders, 'Content-Length': '0' }
        });
        if (res.status === 204) return `starred ${owner}/${repo} ⭐ https://github.com/${owner}/${repo}`;
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
        { type: 'function', function: { name: 'list_repos', description: 'List GitHub repositories for a user', parameters: { type: 'object', properties: { username: { type: 'string', description: 'GitHub username, default xhclintohn' } }, required: ['username'] } } },
        { type: 'function', function: { name: 'create_repo', description: 'Create a new GitHub repository', parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, is_private: { type: 'boolean', description: 'true for private repo' } }, required: ['name'] } } },
        { type: 'function', function: { name: 'delete_repo', description: 'Permanently delete a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string', description: 'Owner, default xhclintohn' }, name: { type: 'string' } }, required: ['owner', 'name'] } } },
        { type: 'function', function: { name: 'rename_repo', description: 'Rename a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, old_name: { type: 'string' }, new_name: { type: 'string' } }, required: ['owner', 'old_name', 'new_name'] } } },
        { type: 'function', function: { name: 'upload_file', description: 'Upload or create a file in a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, file_path: { type: 'string' }, content: { type: 'string' }, message: { type: 'string' } }, required: ['owner', 'repo', 'file_path', 'content'] } } },
        { type: 'function', function: { name: 'get_auth_user', description: 'Get info about the authenticated GitHub user', parameters: { type: 'object', properties: {} } } },
        { type: 'function', function: { name: 'get_repo_info', description: 'Get details about a specific GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } } },
        { type: 'function', function: { name: 'list_branches', description: 'List branches of a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } } },
        { type: 'function', function: { name: 'create_issue', description: 'Create an issue in a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'title'] } } },
        { type: 'function', function: { name: 'star_repo', description: 'Star a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } } }
    ];

    function callGroq(msgs, useTools) {
        const payload = {
            model: 'llama-3.3-70b-versatile',
            messages: msgs,
            max_tokens: 1024,
            parallel_tool_calls: false
        };
        if (useTools) { payload.tools = tools; payload.tool_choice = 'auto'; }
        return fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    try {
        const history = getHistory(m.sender);
        let turnMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: body }
        ];
        pushHistory(m.sender, 'user', body);

        let finalReply = '';
        let toolsRan = [];

        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
            let res = await callGroq(turnMessages, true);

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (err?.error?.code === 'tool_use_failed' && err?.error?.failed_generation) {
                    console.log(`[ToxicAgent] tool_use_failed recovery — ${err.error.failed_generation.slice(0, 100)}`);
                    const fg = err.error.failed_generation;
                    const fm = fg.match(/<function=([^=<>\s]+?)=?(\{[\s\S]*?\})<\/function>/);
                    if (fm) {
                        try {
                            const args = JSON.parse(fm[2]);
                            const toolResult = await executeTool(fm[1].trim(), args);
                            toolsRan.push(toolResult);
                            turnMessages.push({ role: 'assistant', content: `[executed ${fm[1]}]` });
                            turnMessages.push({ role: 'user', content: `Tool result: ${toolResult}\nNow give your final reply.` });
                            continue;
                        } catch {}
                    }
                }
                console.error('[ToxicAgent] Groq error at turn', turn);
                break;
            }

            const data = await res.json();
            const choice = data.choices?.[0];
            if (!choice) break;

            if (choice.finish_reason === 'tool_calls' && choice.message?.tool_calls?.length) {
                const toolCall = choice.message.tool_calls[0];
                const toolName = toolCall.function.name;
                let args = {};
                try { args = JSON.parse(toolCall.function.arguments || '{}'); } catch {}

                let toolResult = '';
                try {
                    toolResult = await executeTool(toolName, args);
                    toolsRan.push(toolResult);
                } catch (e) {
                    toolResult = `ngl that didn't work 😒 — ${e.message}`;
                }

                turnMessages.push(choice.message);
                turnMessages.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResult });
            } else {
                const rawContent = choice.message?.content?.trim() || '';
                if (rawContent.includes('<function=')) {
                    const embedded = await processEmbeddedCalls(rawContent, executeTool);
                    if (embedded) {
                        toolsRan.push(...embedded.results);
                        finalReply = stripEmbeddedFuncTags(embedded.cleaned);
                    } else {
                        finalReply = stripEmbeddedFuncTags(rawContent);
                    }
                } else {
                    finalReply = rawContent;
                }
                break;
            }
        }

        if (!finalReply) {
            finalReply = toolsRan.length
                ? toolsRan.join('\n')
                : 'something went sideways 🤦';
        }

        pushHistory(m.sender, 'assistant', finalReply);
        await client.sendMessage(m.chat, { text: boxWrap(finalReply, 'TOXICAGENT') }, { quoted: m });
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    } catch (e) {
        console.error('[ToxicAgent] error:', e.message);
        try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
    }
};
