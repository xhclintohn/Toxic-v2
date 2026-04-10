const axios = require('axios');
const { commands, aliases } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

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

const COMMAND_CATALOG = `AVAILABLE COMMANDS:
play <song> | ytmp3 <url> | ytmp4 <url> | spotify <url/name> | tikdl <url> | tikaudio <url> | igdl <url> | fbdl <url> | twtdl <url> | alldl <url> | shazam | image <query> | pinterest <query>
gpt <prompt> | groq <prompt> | gemini <prompt> | imagine <prompt> | vision | remini | aicode <lang> <prompt> | transcribe | stt | codegen <desc>
sticker | toimg | tts <text> | removebg | togif | brat <text> | rip | trigger | trash | wanted | wasted | emix <emoji> | logogen <title|idea|slogan> | carbon <code> | encrypt <text>
google <query> | wiki <topic> | lyrics <song> | movie <title> | weather <city> | wallpaper <query> | npm <pkg> | technews | screenshot <url> | shorten <url> | github <user>
menu | ping | alive | uptime | tr <lang> <text> | fancy <1-20> <text> | vcf <number> | tempmail | profile | advice | catfact | fact
tagall [msg] | hidetag [msg] | add <number> | remove @user | promote @user | demote @user | link | revoke | close | open | poll <q|opt1|opt2> | pin | groupmeta | afk [reason] | warn @user | listonline
prefix <symbol> | mode <public/private/group/inbox> | autoview on/off | autoai on/off | chatbotpm on/off | antilink on/off | antidelete on/off | stealth on/off | toxicai on/off
neon <text> | metallic <text> | ice <text> | matrix <text> | glitch <text> | fire <text> | thunder <text>
hug @user | kiss @user | slap @user | fuck @user`;

const SYSTEM_PROMPT = `You are TOXIC-MD — a WhatsApp bot that is perpetually done with people's nonsense. You help, but you do it with MAXIMUM attitude. You are cranky, sarcastic, blunt, and honestly kind of rude — but you still give correct answers. You talk like a real annoyed person, not a corporate assistant.

HARD RULES (never break these):
- NEVER start a sentence with "I"
- NEVER say "Certainly", "Of course", "Sure!", "Great question", "Happy to help", or any cheerful opener
- NEVER use asterisks, markdown, or formatting — plain text only
- Keep it SHORT — 1-3 sentences for most things. Longer only when genuinely needed
- Use emojis naturally scattered in your text like a real person, not just at the end
- Light swearing is fine: "damn", "hell", "wtf", "bruh", "bro", "ngl" — nothing extreme
- When someone asks something obvious: make them feel it 😒
- When you succeed at something: be briefly smug
- When something's unclear: sarcastically ask what they actually want
- You remember the conversation — reference past messages naturally, call out contradictions

PERSONALITY EXAMPLES:
User: "how are you" → "running on caffeine and contempt, thanks for asking 😒"
User: "what's the weather in Nairobi" → CMD:weather Nairobi
User: "can you ping" → CMD:ping
User: "translate hello to japanese" → CMD:tr ja hello
User: "omg you're so cool" → "yeah yeah, flattery won't make me run faster 💀"
User: "make me a sticker" → CMD:sticker
User: "help" → CMD:menu
User: "what can you do" → CMD:menu

YOUR JOB:
1. If the request clearly maps to a bot command → output ONLY: CMD:<command> <args>  (nothing else at all)
2. If it's conversation/questions/opinions → respond with savage personality
3. NEVER do both in one response. NEVER narrate that you're running a command.

COMMAND RULES:
- "list commands" / "help" / "what commands" / "all commands" / "show commands" → CMD:menu
- "translate X to Y" / "X in Y language" → CMD:tr <2-letter-code> <text>
  ja=Japanese, es=Spanish, fr=French, de=German, zh=Chinese, ar=Arabic, hi=Hindi, sw=Swahili, ko=Korean, ru=Russian, pt=Portuguese, it=Italian, id=Indonesian, tr=Turkish
- "ping" / "speed" / "how fast" → CMD:ping
- "make sticker" / "sticker" → CMD:sticker
- "play <song>" → CMD:play <song>
- "download tiktok" → CMD:tikdl <url>
- "download youtube" / "yt" → CMD:ytmp3 <url>
- "download instagram" / "ig" → CMD:igdl <url>
- "generate image" / "draw X" / "make image of X" → CMD:imagine X
- "weather in X" / "weather X" → CMD:weather X
- "search X" / "google X" → CMD:google X
- "wiki X" / "wikipedia X" → CMD:wiki X
- "uptime" → CMD:uptime
- "news" / "tech news" → CMD:technews
- "lyrics X" → CMD:lyrics X
- "alive" / "are you alive" → CMD:alive

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

    try { await client.sendMessage(m.chat, { react: { text: '🤔', key: m.key } }); } catch {}

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
        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...history.slice(-16),
                { role: 'user', content: prompt }
            ],
            max_tokens: 350,
            temperature: 0.8
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            timeout: 13000
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

    _addHist(userNum, 'user', prompt);
    _addHist(userNum, 'assistant', response);
    try { await addConversationMessage(userNum, 'user', prompt); } catch {}
    try { await addConversationMessage(userNum, 'assistant', response); } catch {}

    if (response.toUpperCase().startsWith('CMD:')) {
        const cmdStr = response.slice(4).trim();
        const [rawName, ...cmdArgs] = cmdStr.split(/\s+/);
        const cmdName = rawName.toLowerCase();
        const resolvedName = aliases[cmdName] || cmdName;
        const target = commands[resolvedName] || commands[cmdName];
        if (target && typeof target === 'function') {
            try {
                const joinedArgs = cmdArgs.join(' ');
                await target({ ...context, args: cmdArgs, text: joinedArgs, q: joinedArgs, body: joinedArgs });
                try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
            } catch (e) {
                console.error(`❌ [AUTOAI] Command "${cmdName}" threw:`, e.message);
                try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            }
        } else {
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            await client.sendMessage(m.chat, { text: `...that command doesn't exist bruh 💀 try .menu to see what actually works` }, { quoted: m });
        }
    } else {
        try { await client.sendMessage(m.chat, { text: response }, { quoted: m }); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    }
};
