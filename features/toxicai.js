const fetch = require('node-fetch');

const DEV_NUMBER = '254114885159';

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
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const repos = await res.json();
        return repos.map(r => `- ${r.name} (${r.private ? 'private' : 'public'}, ⭐${r.stargazers_count})`).join('\n');
    }

    async function createRepo(name, description = '', isPrivate = false) {
        const res = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({ name, description, private: isPrivate, auto_init: true })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || `GitHub ${res.status}`); }
        const r = await res.json();
        return `Created: ${r.html_url}`;
    }

    async function deleteRepo(owner, name) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, { method: 'DELETE', headers: ghHeaders });
        if (res.status === 204) return `Deleted ${owner}/${name}`;
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
        return `Renamed to: ${r.html_url}`;
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
        return `Uploaded: ${r.content?.html_url || filePath}`;
    }

    async function getAuthUser() {
        const res = await fetch('https://api.github.com/user', { headers: ghHeaders });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        return res.json();
    }

    const tools = [
        {
            type: 'function',
            function: {
                name: 'list_repos',
                description: 'List GitHub repositories for a user',
                parameters: { type: 'object', properties: { username: { type: 'string', description: 'GitHub username' } }, required: ['username'] }
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
                description: 'Delete a GitHub repository',
                parameters: { type: 'object', properties: { owner: { type: 'string' }, name: { type: 'string' } }, required: ['owner', 'name'] }
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
                description: 'Get the authenticated GitHub user info',
                parameters: { type: 'object', properties: {} }
            }
        }
    ];

    try {
        const messages = [
            { role: 'system', content: `You are ToxicAgent, a powerful GitHub assistant for the developer. You can manage GitHub repositories, upload files, and perform GitHub operations. Be concise and direct. Today: ${new Date().toDateString()}.` },
            { role: 'user', content: body }
        ];

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, tools, tool_choice: 'auto', max_tokens: 1024 })
        });

        if (!res.ok) return;
        const data = await res.json();
        const choice = data.choices?.[0];

        if (!choice) return;

        if (choice.finish_reason === 'tool_calls' && choice.message?.tool_calls?.length) {
            const toolCall = choice.message.tool_calls[0];
            const toolName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments || '{}');

            let toolResult = '';
            try {
                if (toolName === 'list_repos') toolResult = await listRepos(args.username);
                else if (toolName === 'create_repo') toolResult = await createRepo(args.name, args.description, args.private);
                else if (toolName === 'delete_repo') toolResult = await deleteRepo(args.owner, args.name);
                else if (toolName === 'rename_repo') toolResult = await renameRepo(args.owner, args.old_name, args.new_name);
                else if (toolName === 'upload_file') toolResult = await uploadFile(args.owner, args.repo, args.file_path, args.content, args.message);
                else if (toolName === 'get_auth_user') { const u = await getAuthUser(); toolResult = `Login: ${u.login}\nName: ${u.name}\nRepos: ${u.public_repos}\nFollowers: ${u.followers}`; }
            } catch (e) {
                toolResult = `Error: ${e.message}`;
            }

            messages.push(choice.message);
            messages.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResult });

            const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 512 })
            });

            if (!res2.ok) return;
            const data2 = await res2.json();
            const reply2 = data2.choices?.[0]?.message?.content?.trim();
            if (reply2) await client.sendMessage(m.chat, { text: `🤖 *ToxicAgent*\n\n${reply2}` }, { quoted: m });
        } else {
            const reply = choice.message?.content?.trim();
            if (reply) await client.sendMessage(m.chat, { text: `🤖 *ToxicAgent*\n\n${reply}` }, { quoted: m });
        }
    } catch (e) {
        console.error('ToxicAgent error:', e);
    }
};
