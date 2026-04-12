const fetch = require('node-fetch');
const { getFakeQuoted } = require('../lib/fakeQuoted');

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
      const raw = String(text || '').replace(/\n{3,}/g, '\n\n').trim();
      const lines = raw.split('\n');
      const processed = [];
      for (const line of lines) {
          const t = line.trim();
          if (!t) { processed.push('├'); continue; }
          if (/https?:\/\/\S+/.test(t)) {
              processed.push('├');
              processed.push(`├ ${t}`);
              processed.push('├');
          } else {
              processed.push(`├ ${line}`);
          }
      }
      const body = processed.join('\n');
      return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
  }
function isClearIntent(text) {
    return new RegExp('^(clear|reset|wipe|delete|flush|erase)\\s*(this\\s*)?(conv(ersation)?|chat|hist(ory)?|messages?|thread|memory|mem)$', 'i').test(text.trim());
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
        catch (e) { toolResult = 'ran into an error 😒 try again'; }
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
- When something fails: mildly offended on your own behalf. Just say there was an error, move on.
- Light swearing: "damn", "hell", "wtf", "ngl", "bruh" — nothing heavy
- NEVER start with "I" — start with the action, result, or attitude
  - Put URLs and links on their own line (blank line before and after)
  - Organize replies: what you did first, then the link separately on its own line
- When your reply contains a URL or link, put it on its own line with a blank line before and after it
- Organize your replies clearly: action first, then details, then the link on its own line
- GitHub user is always xhclintohn unless they explicitly say someone else
- NEVER mention APIs, HTTP endpoints, response codes, or technical error details to the user. Just say there was an error.

CAPABILITIES:
- List repos, create repos, rename repos, delete repos (when explicitly asked)
- Upload files and images to GitHub repos (returns link)
- Read/check file contents from any repo
- List branches, create issues, star repos
- Check authenticated user info

TOOL USAGE:
- ALWAYS call the actual tool function via tool_calls — never write out function calls as text.
- After each tool result, formulate your final reply naturally. Never expose raw tool syntax or technical details.
- For image uploads: use upload_image_to_github tool.
- For checking file content: use read_file tool.

Today: ${new Date().toDateString()}. Working for: ${GH_USERNAME}.`;

module.exports = async (context) => {
    const { client, m, body: msgBody, isDev } = context;
    const fq = getFakeQuoted(m);

    if (!isDev) return;

    const body = (msgBody || '').trim();
    if (!body && !m.message?.imageMessage && !m.quoted) return;

    let GROQ_KEY = '';
    try { GROQ_KEY = require('../keys').GROQ_API_KEY || ''; } catch {}
    if (!GROQ_KEY) GROQ_KEY = process.env.GROQ_API_KEY || '';
    if (!GROQ_KEY) return;

    let GH_TOKEN = '';
    try { GH_TOKEN = require('../keys').GITHUB_TOKEN || ''; } catch {}
    if (!GH_TOKEN) GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

    const ghHeaders = {
        'Authorization': `token ${GH_TOKEN}`,
        'User-Agent': 'ToxicAgent/4.0',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };

    if (body && isClearIntent(body)) {
        clearHistory(m.sender);
        try { await client.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } }); } catch {}
        await client.sendMessage(m.chat, { text: boxWrap('conversation wiped. gone. zero memory. fresh hell starts now 🗑️', 'MEMORY CLEARED') }, { quoted: fq });
        return;
    }

    try { await client.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }); } catch {}

    let pendingImageBuf = null;
    let pendingImageExt = 'jpg';
    let imageUploadedUrl = null;

    const wantsUpload = body && new RegExp('(upload|send|push|put|add|save).{0,30}(image|photo|pic|picture|img)', 'i').test(body);

    if (wantsUpload || !body) {
        if (m.quoted) {
            const qi = m.quoted.msg || m.quoted;
            const qmime = qi.mimetype || '';
            if (qmime.startsWith('image/') && !qmime.startsWith('image/gif')) {
                try {
                    const buf = await m.quoted.download();
                    if (buf && buf.length > 0) { pendingImageBuf = buf; pendingImageExt = qmime.split('/')[1]?.split(';')[0] || 'jpg'; }
                } catch {}
            }
        }
        if (!pendingImageBuf && m.message?.imageMessage) {
            try {
                const buf = await client.downloadMediaMessage(m);
                if (buf && buf.length > 0) {
                    pendingImageBuf = buf;
                    const imgMime = m.message.imageMessage.mimetype || 'image/jpeg';
                    pendingImageExt = imgMime.split('/')[1]?.split(';')[0] || 'jpg';
                }
            } catch {}
        }
    }

    async function listRepos(username) {
        try {
            const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: ghHeaders });
            if (!res.ok) return 'something went wrong fetching repos 😒';
            const repos = await res.json();
            if (!repos.length) return `${username} has zero repos. bleak.`;
            return repos.map(r => `- ${r.name} (${r.private ? '🔒 private' : '🌐 public'}, ⭐${r.stargazers_count})`).join('\n');
        } catch { return 'ran into an error getting repos 😒'; }
    }

    async function createRepo(name, description, isPrivate) {
        try {
            const res = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: ghHeaders,
                body: JSON.stringify({ name, description: description || '', private: !!isPrivate, auto_init: true })
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'failed'); }
            const r = await res.json();
            return `created ${r.private ? '🔒 private' : '🌐 public'} repo → ${r.html_url}`;
        } catch (e) { return `couldn't create repo 😒 — ${e.message}`; }
    }

    async function deleteRepo(owner, name) {
        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, { method: 'DELETE', headers: ghHeaders });
            if (res.status === 204) return `nuked ${owner}/${name} — gone forever 💀`;
            return 'deletion failed 😒 check the repo name';
        } catch { return 'ran into an error, deletion might not have worked 😒'; }
    }

    async function renameRepo(owner, oldName, newName) {
        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${oldName}`, {
                method: 'PATCH', headers: ghHeaders,
                body: JSON.stringify({ name: newName })
            });
            if (!res.ok) return 'rename failed 😒 check names';
            const r = await res.json();
            return `renamed to ${newName} → ${r.html_url}`;
        } catch { return 'ran into an error renaming 😒'; }
    }

    async function uploadFile(owner, repo, filePath, content, message) {
        try {
            const encoded = Buffer.from(content).toString('base64');
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
                method: 'PUT', headers: ghHeaders,
                body: JSON.stringify({ message: message || 'Upload via ToxicAgent', content: encoded })
            });
            if (!res.ok) return 'upload failed 😒 check the repo and path';
            const r = await res.json();
            return `uploaded ${filePath} → ${r.content?.html_url || `https://github.com/${owner}/${repo}/blob/main/${filePath}`}`;
        } catch { return 'ran into an error uploading 😒'; }
    }

    async function uploadImageToGithub(owner, repo, imgBuf, ext) {
        const ts = Date.now();
        const filePath = `uploads/img_${ts}.${ext || 'jpg'}`;
        const encoded = imgBuf.toString('base64');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT', headers: ghHeaders,
            body: JSON.stringify({ message: 'Upload image via ToxicAgent', content: encoded })
        });
        if (!res.ok) throw new Error('upload failed');
        const r = await res.json();
        return r.content?.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
    }

    async function readFile(owner, repo, filePath) {
        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, { headers: ghHeaders });
            if (!res.ok) return `couldn't find that file 😒`;
            const data = await res.json();
            if (Array.isArray(data)) return `Contents of ${filePath}:\n` + data.map(f => `- ${f.name} (${f.type})`).join('\n');
            if (!data.content) return 'file found but no readable content';
            const content = Buffer.from(data.content, 'base64').toString('utf8');
            return content.slice(0, 3000) + (content.length > 3000 ? '\n...(truncated)' : '');
        } catch { return 'ran into an error reading that file 😒'; }
    }

    async function getAuthUser() {
        try {
            const res = await fetch('https://api.github.com/user', { headers: ghHeaders });
            if (!res.ok) return 'something went wrong 😒';
            const u = await res.json();
            return `${u.login} | ${u.name || 'no name set'} | ${u.public_repos} public repos | ${u.followers} followers | https://github.com/${u.login}`;
        } catch { return 'ran into an error 😒'; }
    }

    async function getRepoInfo(owner, repo) {
        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
            if (!res.ok) return "repo not found or no access 😒";
            const r = await res.json();
            return `${r.full_name} — ${r.description || 'no description'}\n⭐ ${r.stargazers_count} | 🍴 ${r.forks_count} | ${r.private ? '🔒 private' : '🌐 public'}\nLang: ${r.language || 'unknown'}\n${r.html_url}`;
        } catch { return 'ran into an error 😒'; }
    }

    async function listBranches(owner, repo) {
        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers: ghHeaders });
            if (!res.ok) return 'something went wrong 😒';
            const branches = await res.json();
            return branches.map(b => `- ${b.name}`).join('\n') || 'no branches found';
        } catch { return 'ran into an error 😒'; }
    }

    async function createIssue(owner, repo, title, bodyText) {
        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                method: 'POST', headers: ghHeaders,
                body: JSON.stringify({ title, body: bodyText || '' })
            });
            if (!res.ok) return 'issue creation failed 😒';
            const r = await res.json();
            return `issue created → ${r.html_url}`;
        } catch { return 'ran into an error creating the issue 😒'; }
    }

    async function starRepo(owner, repo) {
        try {
            const res = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
                method: 'PUT', headers: { ...ghHeaders, 'Content-Length': '0' }
            });
            if (res.status === 204) return `starred ${owner}/${repo} ⭐ https://github.com/${owner}/${repo}`;
            return 'star failed 😒 check the repo name';
        } catch { return 'ran into an error starring 😒'; }
    }

    async function executeTool(toolName, args) {
        if (toolName === 'list_repos') return listRepos(args.username || GH_USERNAME);
        if (toolName === 'create_repo') return createRepo(args.name, args.description, args.is_private || args.private);
        if (toolName === 'delete_repo') return deleteRepo(args.owner || GH_USERNAME, args.name);
        if (toolName === 'rename_repo') return renameRepo(args.owner || GH_USERNAME, args.old_name, args.new_name);
        if (toolName === 'upload_file') return uploadFile(args.owner || GH_USERNAME, args.repo, args.file_path, args.content, args.message);
        if (toolName === 'upload_image_to_github') {
            if (!pendingImageBuf) return 'no image found. quote or send an image first.';
            try {
                const url = await uploadImageToGithub(args.owner || GH_USERNAME, args.repo || 'Toxic-v2', pendingImageBuf, pendingImageExt);
                imageUploadedUrl = url;
                return `image uploaded 📎 link: ${url}`;
            } catch { return 'image upload ran into an error 😒'; }
        }
        if (toolName === 'read_file') return readFile(args.owner || GH_USERNAME, args.repo, args.file_path || args.path);
        if (toolName === 'get_auth_user') return getAuthUser();
        if (toolName === 'get_repo_info') return getRepoInfo(args.owner || GH_USERNAME, args.repo);
        if (toolName === 'list_branches') return listBranches(args.owner || GH_USERNAME, args.repo);
        if (toolName === 'create_issue') return createIssue(args.owner || GH_USERNAME, args.repo, args.title, args.body);
        if (toolName === 'star_repo') return starRepo(args.owner || GH_USERNAME, args.repo);
        return 'unknown action 😒';
    }

    const tools = [
        { type: 'function', function: { name: 'list_repos', description: 'List GitHub repositories for a user', parameters: { type: 'object', properties: { username: { type: 'string', description: 'GitHub username, default xhclintohn' } }, required: ['username'] } } },
        { type: 'function', function: { name: 'create_repo', description: 'Create a new GitHub repository', parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, is_private: { type: 'boolean' } }, required: ['name'] } } },
        { type: 'function', function: { name: 'delete_repo', description: 'Permanently delete a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string', description: 'Owner, default xhclintohn' }, name: { type: 'string' } }, required: ['owner', 'name'] } } },
        { type: 'function', function: { name: 'rename_repo', description: 'Rename a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, old_name: { type: 'string' }, new_name: { type: 'string' } }, required: ['owner', 'old_name', 'new_name'] } } },
        { type: 'function', function: { name: 'upload_file', description: 'Upload or create a text file in a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, file_path: { type: 'string' }, content: { type: 'string' }, message: { type: 'string' } }, required: ['owner', 'repo', 'file_path', 'content'] } } },
        { type: 'function', function: { name: 'upload_image_to_github', description: 'Upload the image sent/quoted by the user to a GitHub repository and return the link', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string', description: 'Which repo to upload to, default Toxic-v2' } }, required: ['repo'] } } },
        { type: 'function', function: { name: 'read_file', description: 'Read/check the content of a specific file in a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, file_path: { type: 'string', description: 'Path to file like src/index.js' } }, required: ['owner', 'repo', 'file_path'] } } },
        { type: 'function', function: { name: 'get_auth_user', description: 'Get info about the authenticated GitHub user', parameters: { type: 'object', properties: {} } } },
        { type: 'function', function: { name: 'get_repo_info', description: 'Get details about a specific GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } } },
        { type: 'function', function: { name: 'list_branches', description: 'List branches of a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } } },
        { type: 'function', function: { name: 'create_issue', description: 'Create an issue in a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'title'] } } },
        { type: 'function', function: { name: 'star_repo', description: 'Star a GitHub repository', parameters: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } } }
    ];

    function callGroq(msgs, useTools) {
        const payload = { model: 'llama-3.3-70b-versatile', messages: msgs, max_tokens: 1024, parallel_tool_calls: false };
        if (useTools) { payload.tools = tools; payload.tool_choice = 'auto'; }
        return fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    try {
        const history = getHistory(m.sender);
        const userContent = body || (pendingImageBuf ? 'upload this image to github' : 'what can you do?');
        let turnMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: userContent }
        ];
        pushHistory(m.sender, 'user', userContent);

        let finalReply = '';
        let toolsRan = [];

        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
            let res = await callGroq(turnMessages, true);

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (err?.error?.code === 'tool_use_failed' && err?.error?.failed_generation) {
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
                finalReply = 'something went wrong 😒 try again';
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
                try { toolResult = await executeTool(toolName, args); toolsRan.push(toolResult); }
                catch { toolResult = 'ran into an error 😒'; }
                turnMessages.push(choice.message);
                turnMessages.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResult });
            } else {
                const rawContent = choice.message?.content?.trim() || '';
                if (rawContent.includes('<function=')) {
                    const embedded = await processEmbeddedCalls(rawContent, executeTool);
                    if (embedded) { toolsRan.push(...embedded.results); finalReply = stripEmbeddedFuncTags(embedded.cleaned); }
                    else finalReply = stripEmbeddedFuncTags(rawContent);
                } else {
                    finalReply = rawContent;
                }
                break;
            }
        }

        if (!finalReply) {
            finalReply = toolsRan.length ? toolsRan.join('\n') : 'something went sideways 🤦';
        }

        pushHistory(m.sender, 'assistant', finalReply);
        await client.sendMessage(m.chat, { text: boxWrap(finalReply, 'TOXICAGENT') }, { quoted: fq });
        if (imageUploadedUrl) {
            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ IMAGE UPLOADED ≪───\n├\n├ 🔗 ${imageUploadedUrl}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        }
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    } catch {
        try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
    }
};
