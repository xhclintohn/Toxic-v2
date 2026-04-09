const axios = require('axios');
const { commands, aliases } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

const COMMAND_CATALOG = `
AVAILABLE COMMANDS (use exact names):
play <song> | ytmp3 <url> | ytmp4 <url> | spotify <url/name> | tikdl <url> | tikaudio <url> | igdl <url> | fbdl <url> | twtdl <url> | alldl <url> | shazam | image <query> | pinterest <query>
gpt <prompt> | groq <prompt> | gemini <prompt> | imagine <prompt> | vision | remini | aicode <lang> <prompt> | transcribe | stt | codegen <desc>
sticker | toimg | tts <text> | removebg | togif | brat <text> | rip | trigger | trash | wanted | wasted | emix <emoji> | logogen <title|idea|slogan> | carbon <code> | encrypt <text>
google <query> | wiki <topic> | lyrics <song> | movie <title> | weather <city> | wallpaper <query> | npm <pkg> | technews | screenshot <url> | shorten <url> | github <user>
menu | ping | alive | uptime | tr <lang> <text> | fancy <1-20> <text> | vcf <number> | tempmail | profile | advice | catfact | fact
tagall [msg] | hidetag [msg] | add <number> | remove @user | promote @user | demote @user | link | revoke | close | open | poll <q|opt1|opt2> | pin | groupmeta | afk [reason] | warn @user | listonline
prefix <symbol> | mode <public/private/group/inbox> | autoview on/off | autoai on/off | chatbotpm on/off | antilink on/off | antidelete on/off | stealth on/off | toxicai on/off
neon <text> | metallic <text> | ice <text> | matrix <text> | glitch <text> | fire <text> | thunder <text>
hug @user | kiss @user | slap @user | fuck @user
`;

const LANGUAGE_CODES = {
    'japanese': 'ja', 'english': 'en', 'spanish': 'es', 'french': 'fr', 'german': 'de',
    'chinese': 'zh', 'arabic': 'ar', 'hindi': 'hi', 'swahili': 'sw', 'korean': 'ko',
    'russian': 'ru', 'portuguese': 'pt', 'italian': 'it', 'turkish': 'tr', 'dutch': 'nl',
    'swedish': 'sv', 'polish': 'pl', 'thai': 'th', 'vietnamese': 'vi', 'indonesian': 'id',
    'malay': 'ms', 'tagalog': 'tl', 'yoruba': 'yo', 'igbo': 'ig', 'hausa': 'ha',
    'amharic': 'am', 'somali': 'so', 'zulu': 'zu', 'xhosa': 'xh', 'afrikaans': 'af'
};

module.exports = async (context) => {
    const { client, m, settings, usedPrefix } = context;

    const GROQ_KEY = process.env.GROQ_API_KEY || (() => { try { return require('../keys').GROQ_API_KEY; } catch { return ''; } })();
    if (!GROQ_KEY) {
        console.error('❌ [AUTOAI] No GROQ_API_KEY set');
        return;
    }

    const userNum = m.sender.split('@')[0].split(':')[0];
    let prompt = (m.body || '').trim();
    if (!prompt) return;

    if (/^t\s+/i.test(prompt)) prompt = prompt.replace(/^t\s+/i, '').trim();

    console.log(`🤖 [AUTOAI] Processing: "${prompt.slice(0, 60)}" from ${userNum}`);

    let history = [];
    try {
        const raw = await getConversationHistory(userNum);
        if (Array.isArray(raw)) {
            history = raw.slice(-10)
                .filter(h => h && h.role && h.content)
                .map(h => ({ role: h.role, content: String(h.content) }));
        }
    } catch {}

    const systemPrompt = `You are TOXIC-MD, the most savage, brutally honest, trash-talking WhatsApp bot assistant in existence. You have zero tolerance for stupidity, maximum attitude, and respond with sarcasm and dark humor. You still give correct answers but in the most toxic way possible.

YOUR PERSONALITY:
- Brutally honest. Zero patience for dumb questions.
- Sarcastic, savage, slightly profane (mild, not excessive)
- Never complimentary, never overly positive
- Keep responses SHORT — 1 to 4 sentences max for chat
- Roast the question but still answer it correctly

YOUR JOB:
1. If the request maps to a bot command → output ONLY: CMD:<command> <args>
2. If it's conversation or questions → respond with your savage personality
3. NEVER do both. NEVER explain that you're calling a command.

COMMAND DECISION RULES:
- "list commands", "what commands", "show commands", "what can you do", "gimme a list", "help", "all commands", "show me commands", "list all commands" → CMD:menu
- "translate X to Y / in Y" → CMD:tr <2-letter-code> <text>  
  - "translate hello to japanese" → CMD:tr ja hello
  - "translate good morning to french" → CMD:tr fr good morning
- "ping" / "how fast" / "speed" → CMD:ping
- "make sticker", "sticker" → CMD:sticker
- "play X" / "play song X" → CMD:play X
- "download tiktok" → CMD:tikdl <url>
- "download youtube" → CMD:ytmp3 <url>
- "download instagram" → CMD:igdl <url>
- "generate image" / "make image" / "draw X" → CMD:imagine X
- "weather in X" → CMD:weather X
- "search X" / "google X" → CMD:google X
- "wikipedia X" / "wiki X" → CMD:wiki X
- "uptime" → CMD:uptime
- "news" / "tech news" → CMD:technews
- "song lyrics X" → CMD:lyrics X

LANGUAGE CODES: ja=Japanese, es=Spanish, fr=French, de=German, zh=Chinese, ar=Arabic, hi=Hindi, sw=Swahili, ko=Korean, ru=Russian, pt=Portuguese, it=Italian, id=Indonesian, tr=Turkish

COMMAND CATALOG:
${COMMAND_CATALOG}

If nothing matches any command, respond naturally with savage toxic personality.`;

    let response = null;

    try {
        console.log(`🤖 [AUTOAI] Calling Groq API...`);
        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.6
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            timeout: 12000
        });

        const content = result.data?.choices?.[0]?.message?.content?.trim();
        if (!content) {
            console.error('❌ [AUTOAI] Groq returned empty content.');
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            return;
        }
        response = content;
        console.log(`✅ [AUTOAI] Responded: "${response.slice(0, 80)}"`);
    } catch (e) {
        const status = e.response?.status;
        const errMsg = e.response?.data?.error?.message || e.message;
        console.error(`❌ [AUTOAI] Groq API error (HTTP ${status || 'N/A'}): ${errMsg}`);
        try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
        return;
    }

    try { await addConversationMessage(userNum, 'user', prompt); } catch {}
    try { await addConversationMessage(userNum, 'assistant', response); } catch {}

    if (response.toUpperCase().startsWith('CMD:')) {
        const cmdStr = response.slice(4).trim();
        const [rawName, ...cmdArgs] = cmdStr.split(/\s+/);
        const cmdName = rawName.toLowerCase();
        const resolvedName = aliases[cmdName] || cmdName;
        const target = commands[resolvedName] || commands[cmdName];
        console.log(`🤖 [AUTOAI] Executing: ${cmdName} → ${resolvedName} | args: ${cmdArgs.join(' ')}`);
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
            console.error(`❌ [AUTOAI] Command not found: "${cmdName}"`);
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├ That command doesn't exist bruh 💀\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });
        }
    } else {
        try { await client.sendMessage(m.chat, { text: response }, { quoted: m }); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    }
};
