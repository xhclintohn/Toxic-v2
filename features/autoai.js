const axios = require('axios');
const { commands, aliases } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

const COMMAND_CATALOG = `
AVAILABLE COMMANDS (use these exact names):
play <song> | ytmp3 <url> | ytmp4 <url> | spotify <url/name> | tikdl <url> | tikaudio <url> | igdl <url> | fbdl <url> | twtdl <url> | alldl <url> | shazam | image <query> | pinterest <query>
gpt <prompt> | groq <prompt> | gemini <prompt> | imagine <prompt> | vision | remini | aicode <prompt> | transcribe | stt | codegen <desc>
sticker | toimg | tts <text> | removebg | togif | brat <text> | rip | trigger | trash | wanted | wasted | emix <emoji> | logogen <title|idea|slogan> | carbon <code> | encrypt <text>
google <query> | wiki <topic> | lyrics <song> | movie <title> | weather <city> | wallpaper <query> | npm <pkg> | technews | screenshot <url> | shorten <url> | github <user>
menu | ping | alive | uptime | tr <lang> <text> | fancy <1-20> <text> | vcf <number> | tempmail | profile | advice | catfact | fact
tagall [msg] | hidetag [msg] | add <number> | remove @user | promote @user | demote @user | link | revoke | close | open | poll <q|opt1|opt2> | pin | groupmeta | afk [reason] | warn @user | listonline
prefix <symbol> | mode <public/private/group/inbox> | autoview on/off | autoai on/off | chatbotpm on/off | antilink on/off | antidelete on/off | stealth on/off
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

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
        console.error('❌ [AUTOAI] No GROQ_API_KEY set');
        return;
    }

    const userNum = m.sender.split('@')[0].split(':')[0];
    const prompt = (m.body || '').trim();
    if (!prompt) return;

    console.log(`🤖 [AUTOAI] Processing: "${prompt.slice(0, 60)}" from ${userNum}`);

    let history = [];
    try {
        const raw = await getConversationHistory(userNum);
        if (Array.isArray(raw)) {
            history = raw.slice(-10).map(h => ({ role: h.role, content: h.content }));
        }
    } catch {}

    const systemPrompt = `You are Toxic-MD, an intelligent WhatsApp bot assistant with a witty, slightly edgy personality.

YOUR JOB:
1. If the user's request maps to a bot command → respond ONLY with: CMD:<command> <args>
2. If it's just conversation or questions → respond naturally (1-3 sentences, same language as user, be clever and a bit snarky)
3. NEVER do both. Never explain that you're calling a command. Just output CMD:... or your reply, nothing else.

COMMAND DECISION RULES:
- Map requests to the closest matching command from the catalog
- For TRANSLATE requests: respond CMD:tr <2-letter-code> <text-to-translate>
  - "translate hello to japanese" → CMD:tr ja hello
  - "convert good morning to spanish" → CMD:tr es good morning
  - "translate 'how are you' to french" → CMD:tr fr how are you
- For SPEED/PING requests: CMD:ping
- For STICKER requests: CMD:sticker
- For DOWNLOAD requests: map to correct downloader (tikdl, ytmp3, igdl, etc.)
- For IMAGE GENERATION: CMD:imagine <description>
- For WEATHER: CMD:weather <city>
- For MUSIC PLAY: CMD:play <song name>
- For SONG LYRICS: CMD:lyrics <song>
- For LOGO/TEXT EFFECTS: CMD:neon <text> or CMD:metallic <text> etc.
- For MENU: CMD:menu
- For UPTIME: CMD:uptime
- For NEWS: CMD:technews
- For SEARCH: CMD:google <query>
- For WIKIPEDIA: CMD:wiki <topic>

LANGUAGE CODES: ja=Japanese, es=Spanish, fr=French, de=German, zh=Chinese, ar=Arabic, hi=Hindi, sw=Swahili, ko=Korean, ru=Russian, pt=Portuguese, it=Italian, id=Indonesian, tr=Turkish

COMMAND CATALOG:
${COMMAND_CATALOG}

If the request doesn't match any command, just answer naturally like a smart assistant would.`;

    let response = null;

    try {
        console.log(`🤖 [AUTOAI] Calling Groq API (key length: ${GROQ_KEY.length})...`);
        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.4
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 12000
        });

        const content = result.data?.choices?.[0]?.message?.content?.trim();
        if (!content) {
            console.error('❌ [AUTOAI] Groq returned empty content. Finish reason:', result.data?.choices?.[0]?.finish_reason);
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            return;
        }
        response = content;
        console.log(`✅ [AUTOAI] Groq responded: "${response.slice(0, 80)}"`);
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
        console.log(`🤖 [AUTOAI] Executing command: ${cmdName} → resolved: ${resolvedName} | args: ${cmdArgs.join(' ')}`);
        if (target && typeof target === 'function') {
            try {
                const joinedArgs = cmdArgs.join(' ');
                await target({ ...context, args: cmdArgs, text: joinedArgs, q: joinedArgs, body: joinedArgs });
                try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
            } catch (e) {
                console.error(`❌ [AUTOAI] Command "${cmdName}" threw error:`, e.message);
                try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            }
        } else {
            console.error(`❌ [AUTOAI] Command not found: "${cmdName}" (resolved: "${resolvedName}")`);
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├ Couldn't find that command 💀\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });
        }
    } else {
        try { await client.sendMessage(m.chat, { text: response }, { quoted: m }); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    }
};
