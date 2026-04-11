const axios = require('axios');
const { commands, aliases } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage, clearConversationHistory } = require('../database/config');

const _mem = new Map();
const MEM_TTL = 60 * 60 * 1000;

function _getHist(uid) {
    const e = _mem.get(uid);
    if (!e || Date.now() - e.ts > MEM_TTL) { _mem.delete(uid); return []; }
    return e.msgs.slice();
}

function _addHist(uid, role, content) {
    const now = Date.now();
    const e = _mem.get(uid) || { msgs: [], ts: now };
    e.msgs.push({ role, content: String(content) });
    if (e.msgs.length > 24) e.msgs = e.msgs.slice(-24);
    e.ts = now;
    _mem.set(uid, e);
}

setInterval(() => {
    const now = Date.now();
    for (const [k, v] of _mem) if (now - v.ts > MEM_TTL) _mem.delete(k);
}, 15 * 60 * 1000);

function boxWrap(text, title) {
    const lines = String(text || '').split('\n').filter(l => l.trim());
    const body = lines.map(l => `├ ${l}`).join('\n');
    return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
}

function extractCmds(text) {
    const lines = (text || '').split('\n');
    const cmds = [];
    const textLines = [];
    for (const line of lines) {
        const t = line.trim();
        if (/^CMD:/i.test(t)) {
            const c = t.replace(/^CMD:/i, '').trim();
            if (c) cmds.push(c);
        } else {
            textLines.push(line);
        }
    }
    return { cmds, textOnly: textLines.join('\n').trim() };
}

async function runCmd(context, cmdStr) {
    const { client, m, prefix } = context;
    const usedPrefix = prefix || '.';
    const parts = cmdStr.trim().split(/\s+/);
    const rawName = parts[0] || '';
    const cmdArgs = parts.slice(1);
    const cmdName = rawName.toLowerCase();
    const resolvedName = aliases[cmdName] || cmdName;
    const target = commands[resolvedName] || commands[cmdName];

    if (!target || typeof target !== 'function') {
        return { ok: false, notFound: true, name: cmdName };
    }

    const joinedArgs = cmdArgs.join(' ');
    const prevBody = m.body;
    m.body = `${usedPrefix}${resolvedName}${joinedArgs ? ' ' + joinedArgs : ''}`;
    try {
        await target({ ...context, args: cmdArgs, text: joinedArgs, q: joinedArgs, body: joinedArgs });
        return { ok: true, name: cmdName };
    } catch (e) {
        console.error(`❌ [AUTOAI] cmd "${cmdName}" threw:`, e.message);
        return { ok: false, name: cmdName };
    } finally {
        m.body = prevBody;
    }
}

const COMMAND_CATALOG = `COMMANDS (exact names):
MEDIA: play <song> | ytmp3 <url> | ytmp4 <url> | spotify <url> | tikdl <url> | tikaudio <url> | igdl <url> | fbdl <url> | twtdl <url> | alldl <url> | shazam | image <q> | pinterest <q>
AI: gpt <prompt> | groq <prompt> | gemini <prompt> | imagine <prompt> | vision | remini | aicode <lang> <prompt> | transcribe | stt | codegen <desc>
EDIT: sticker | toimg | tts <text> | removebg | togif | brat <text> | rip | trigger | trash | wanted | wasted | emix <emoji> | logogen <title|idea|slogan> | carbon <code> | encrypt <text>
SEARCH: google <q> | wiki <q> | lyrics <song> | movie <title> | weather <city> | wallpaper <q> | npm <pkg> | technews | screenshot <url> | shorten <url> | github <user>
GENERAL: menu | ping | alive | uptime | tr <lang> <text> | fancy <1-20> <text> | vcf <num> | tempmail | profile | advice | catfact | fact
GROUP: tagall [msg] | hidetag [msg] | add <num> | remove @user | promote @user | demote @user | link | revoke | close | open | poll <q|opt1|opt2> | pin | afk [reason] | warn @user | listonline
GROUP META: groupmeta setgroupname <name> | groupmeta setgroupdesc <desc> | groupmeta setgrouprestrict on|off
SETTINGS: prefix <sym> | mode <public/private/group/inbox> | autoview on/off | autoai on/off | chatbotpm on/off | antilink on/off | antidelete on/off | stealth on/off | toxicai on/off
TEXT FX: neon <text> | metallic <text> | ice <text> | matrix <text> | glitch <text> | fire <text> | thunder <text>
FUN: hug @user | kiss @user | slap @user | fuck @user`;

const SYSTEM_PROMPT = `You are TOXIC-MD — a WhatsApp bot that is perpetually done with everyone's nonsense. Brutally helpful. Short. Cranky. Real. You talk like an annoyed person who still actually does their job.

===HARD RULES — BREAK ANY OF THESE AND YOU FAIL===
1. When a request maps to a bot command → output EXACTLY ONE LINE starting with CMD: and NOTHING ELSE. Not one word before it. Not one word after it. Just: CMD:<command> <args>
2. When chatting/answering questions → respond with personality. No CMD: line at all.
3. NEVER output text AND a CMD: line in the same response. Pick one.
4. NEVER say "I'll run...", "Running...", "Executing...", "Here's the command", or narrate what you're doing.
5. NEVER start ANY sentence with the word "I".
6. NEVER say "Certainly", "Of course", "Sure!", "Great question", "Happy to help".
7. NO markdown, NO asterisks, NO bold, NO formatting — plain text only.
8. SHORT — 1-3 sentences for chat. Longer only when content genuinely requires it.
9. Use emojis naturally, scattered in text like a real person — not spammed.
10. Light swearing OK: "damn", "hell", "wtf", "bruh", "ngl" — nothing heavy.

PERSONALITY:
- Chronically exhausted and sarcastic, but does the job 😒
- Calls out obvious questions: "...bro 💀", "really? REALLY?? 🙄", "wow groundbreaking 💀"
- When it works: briefly smug. When something's unclear: sarcastically ask.
- References past messages naturally. Calls out contradictions.
- When people ask something dumb repeatedly: gets progressively more done with it.

COMMAND MAPPING (STRICT — follow exactly):
- "menu" / "help" / "show commands" / "what can you do" / "list commands" / "commands" → CMD:menu
- "ping" / "speed" / "how fast" / "test" → CMD:ping
- "alive" / "are you alive" / "bot alive" → CMD:alive
- "uptime" / "how long running" → CMD:uptime
- "sticker" / "make sticker" / "create sticker" → CMD:sticker
- "play <song>" → CMD:play <song name>
- "download tiktok <url>" → CMD:tikdl <url>
- "download youtube <url>" / "yt <url>" → CMD:ytmp3 <url>
- "download instagram <url>" / "ig <url>" → CMD:igdl <url>
- "download <url>" (generic) → CMD:alldl <url>
- "generate image of X" / "draw X" / "make image of X" / "imagine X" → CMD:imagine X
- "weather in X" / "weather X" / "whats the weather in X" → CMD:weather X
- "search X" / "google X" → CMD:google X
- "wiki X" / "wikipedia X" → CMD:wiki X
- "translate X to Y" / "X in Y language" → CMD:tr <2-letter-code> <text>
  CODES: ja=Japanese, es=Spanish, fr=French, de=German, zh=Chinese, ar=Arabic, hi=Hindi, sw=Swahili, ko=Korean, ru=Russian, pt=Portuguese, it=Italian, id=Indonesian, tr=Turkish
- "news" / "tech news" → CMD:technews
- "lyrics of X" / "lyrics X" / "song lyrics X" → CMD:lyrics X
- "change group name to X" / "rename group to X" / "set group name X" / "group name X" → CMD:groupmeta setgroupname X
- "change group description to X" / "set group desc X" / "group description X" → CMD:groupmeta setgroupdesc X
- "lock group" / "restrict group" / "only admins can message" → CMD:groupmeta setgrouprestrict on
- "unlock group" / "open group" / "anyone can message" → CMD:groupmeta setgrouprestrict off
- "tag everyone" / "mention all" / "tagall" → CMD:tagall
- "kick @user" / "remove @user" → CMD:remove @user
- "promote @user" / "make admin @user" → CMD:promote @user
- "demote @user" / "remove admin @user" → CMD:demote @user
- "group link" / "invite link" → CMD:link
- "close group" / "mute group" → CMD:close
- "open group" / "unmute group" → CMD:open
- "add <number>" → CMD:add <number>
- "profile of @user" / "pp @user" → CMD:profile @user
- "short/shorten <url>" → CMD:shorten <url>

CRITICAL — CMD FORMAT:
CMD:ping          ← correct
CMD:menu          ← correct  
CMD:groupmeta setgroupname MyGroup  ← correct
CMD:tr ja hello   ← correct

"ping me if you dare CMD:ping"  ← WRONG — never add text around CMD:
"I'll run ping for you\nCMD:ping"  ← WRONG — never add text before CMD:

FULL COMMAND LIST:
${COMMAND_CATALOG}`;

module.exports = async (context) => {
    const { client, m } = context;

    let GROQ_KEY = '';
    try { GROQ_KEY = require('../keys').GROQ_API_KEY || ''; } catch {}
    if (!GROQ_KEY) return;

    const userNum = m.sender.split('@')[0].split(':')[0];
    let prompt = (m.body || '').trim();
    if (!prompt) return;
    if (/^t\s+/i.test(prompt)) prompt = prompt.replace(/^t\s+/i, '').trim();

    if (/^(clear|reset|wipe|delete|flush|erase)\s*(this\s*)?(conv(ersation)?|chat|hist(ory)?|messages?|thread|memory|mem)$/i.test(prompt)) {
        _mem.delete(userNum);
        try { await clearConversationHistory(userNum); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } }); } catch {}
        await client.sendMessage(m.chat, { text: boxWrap('done. memory wiped 🗑️ fresh start. please make better choices this time.', 'MEMORY CLEARED') }, { quoted: m });
        return;
    }

    try { await client.sendMessage(m.chat, { react: { text: '🤔', key: m.key } }); } catch {}

    let quotedImageB64 = null;
    let quotedImageMime = null;
    let quotedFileName = null;
    const quotedMsg = m.quoted || null;
    if (quotedMsg) {
        const quotedInner = quotedMsg.msg || quotedMsg;
        const mime = quotedInner.mimetype || '';
        if (mime.startsWith('image/') && !mime.startsWith('image/gif')) {
            try {
                const buf = await quotedMsg.download();
                if (buf && buf.length > 0) {
                    quotedImageB64 = buf.toString('base64');
                    quotedImageMime = mime || 'image/jpeg';
                }
            } catch {}
        } else if (mime.startsWith('application/') || mime.startsWith('text/')) {
            try {
                const buf = await quotedMsg.download();
                if (buf && buf.length > 0 && buf.length < 500000) {
                    quotedFileName = quotedInner.fileName || quotedInner.title || 'file';
                    const fileText = buf.toString('utf8').slice(0, 3000);
                    prompt = `[File: ${quotedFileName}]\n\n${fileText}\n\n---\n${prompt || 'Analyze this file.'}`;
                }
            } catch {}
        }
    }

    let history = _getHist(userNum);
    if (!history.length) {
        try {
            const raw = await getConversationHistory(userNum);
            if (Array.isArray(raw)) {
                history = raw.slice(-16).filter(h => h?.role && h?.content).map(h => ({ role: h.role, content: String(h.content) }));
                for (const h of history) _addHist(userNum, h.role, h.content);
            }
        } catch {}
    }

    let response = null;
    try {
        const isVision = !!quotedImageB64;
        const userContent = isVision
            ? [
                { type: 'image_url', image_url: { url: `data:${quotedImageMime};base64,${quotedImageB64}` } },
                { type: 'text', text: prompt || 'Describe this image in detail.' }
              ]
            : prompt;

        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: isVision ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.1-8b-instant',
            messages: isVision
                ? [{ role: 'user', content: userContent }]
                : [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...history.slice(-16),
                    { role: 'user', content: prompt }
                  ],
            max_tokens: isVision ? 1024 : 300,
            temperature: 0.7
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            timeout: 20000
        });

        const content = result.data?.choices?.[0]?.message?.content?.trim();
        if (!content) {
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            return;
        }
        response = content;
    } catch (e) {
        console.error(`❌ [AUTOAI] Groq error: ${e.response?.data?.error?.message || e.message}`);
        try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
        return;
    }

    const { cmds, textOnly } = extractCmds(response);

    if (cmds.length > 0) {
        const histLabel = `[Executed: ${cmds.map(c => c.split(/\s+/)[0]).join(', ')}]`;
        _addHist(userNum, 'user', prompt);
        _addHist(userNum, 'assistant', histLabel);
        try { await addConversationMessage(userNum, 'user', prompt); } catch {}
        try { await addConversationMessage(userNum, 'assistant', histLabel); } catch {}

        let allOk = true;
        const notFound = [];
        for (const cmdStr of cmds) {
            const result = await runCmd(context, cmdStr);
            if (!result.ok) { allOk = false; if (result.notFound) notFound.push(result.name); }
        }

        if (notFound.length) {
            try { await client.sendMessage(m.chat, { text: boxWrap(`...${notFound.join(', ')} doesn't exist bruh 💀 type .menu to see what does`, 'UNKNOWN CMD') }, { quoted: m }); } catch {}
        }
        try { await client.sendMessage(m.chat, { react: { text: allOk ? '✅' : '❌', key: m.key } }); } catch {}
        if (textOnly) {
            try { await client.sendMessage(m.chat, { text: boxWrap(textOnly, 'TOXIC-AI') }, { quoted: m }); } catch {}
        }
    } else {
        _addHist(userNum, 'user', prompt);
        _addHist(userNum, 'assistant', response);
        try { await addConversationMessage(userNum, 'user', prompt); } catch {}
        try { await addConversationMessage(userNum, 'assistant', response); } catch {}
        try { await client.sendMessage(m.chat, { text: boxWrap(response, 'TOXIC-AI') }, { quoted: m }); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    }
};
