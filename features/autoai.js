const axios = require('axios');
const fetch = require('node-fetch');
const { commands, aliases } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

const COMMAND_CATALOG = `
MUSIC & DOWNLOADS:
- play <song name or youtube url> → play or download a song/music
- ytmp3 <url> → download youtube as audio
- ytmp4 <url> → download youtube as video
- yt <query> → youtube search
- yts <query> → youtube search list
- spotify <url or name> → download spotify track
- tikdl <url> → download tiktok video
- tikaudio <url> → tiktok audio only
- igdl <url> → download instagram reel/post
- fbdl <url> → download facebook video
- twtdl <url> → download twitter/X video
- alldl <url> → universal downloader
- mediafire <url> → mediafire file download
- apk <app name> → download android apk
- shazam → identify a song (reply to audio)
- image <query> → download image
- pinterest <query> → pinterest images
- video <query> → search and download video

AI TOOLS:
- gpt <prompt> → ask ChatGPT
- groq <prompt> → ask Groq AI
- gemini <prompt> → ask Google Gemini
- imagine <prompt> → generate AI image from text
- vision → analyze/describe image with AI (reply to image)
- remini → enhance or upscale image quality HD (reply to image)
- aicode <prompt> → generate code with AI
- transcribe → transcribe voice note to text (reply to audio)
- stt → speech to text (reply to voice message)
- codegen <description> → generate code from description
- chat <prompt> → AI chat

STICKERS & EDITING:
- sticker → convert image/gif/video to WhatsApp sticker
- toimg → convert sticker back to image
- tts <text> → text to speech audio
- removebg → remove image background (reply to image)
- imgedit <prompt> → edit image with AI (reply to image)
- togif → convert video to gif
- tofigure → cartoon figure from image
- toghibli → ghibli anime style filter
- toanime → anime style filter
- brat <text> → brat text style meme
- rip → RIP meme (reply to image)
- trigger → triggered gif (reply to image)
- trash → trash meme (reply to image)
- wanted → wanted poster (reply to image)
- wasted → wasted meme (reply to image)
- emix <emoji> → emoji mix
- logogen <text> → logo text generator
- carbon <code> → code screenshot
- encrypt <text> → encrypt text

SEARCH & INFORMATION:
- google <query> → google search results
- wiki <topic> → wikipedia summary
- lyrics <song name> → get song lyrics
- movie <title> → movie information
- song <query> → search for a song
- weather <city> → weather forecast
- wallpaper <query> → download wallpaper
- npm <package name> → npm package info
- technews → latest tech news
- screenshot <url> → take website screenshot
- shorten <url> → shorten a link
- github <user or repo> → github profile/repo info

GENERAL:
- menu → show all bot commands
- ping → check bot speed/latency
- alive → check if bot is online
- uptime → bot uptime
- tr <lang> <text> → translate text (e.g. tr es hello)
- fancy <1-20> <text> → fancy text styles
- vcf <number> → create contact card
- tempmail → get temporary email address
- profile → view your bot profile
- advice → random advice
- catfact → random cat fact
- fact → random interesting fact
- weather <city> → get weather info

GROUPS (some need admin):
- tagall <message> → tag all group members
- hidetag <message> → tag all members silently
- add <number> → add member to group
- remove @user → kick member from group
- promote @user → make member an admin
- demote @user → remove admin from member
- link → get group invite link
- revoke → reset group invite link
- close → lock group (admins only)
- open → unlock group (admins only)
- poll <question|opt1|opt2> → create a poll
- pin → pin a message (reply to message)
- clear → delete all messages
- groupmeta → show group info and stats
- afk <reason> → set yourself as AFK
- hug @user → hug someone
- kiss @user → kiss someone
- slap @user → slap someone

SETTINGS (owner only):
- prefix <symbol> → change command prefix
- mode <public/private/group/inbox> → set bot mode
- autoview on/off → auto view status updates
- autolike on/off → auto like status
- autoread on/off → auto read messages
- antidelete on/off → recover deleted messages
- antitag on/off → anti-tag in groups
- stealth on/off → stealth mode
- autoai on/off → toggle this AI agent
- addsudo <number> → add a sudo user
- delsudo <number> → remove a sudo user
- ban @user → ban user from bot
- unban @user → unban user
`;

async function callGroq(systemPrompt, userPrompt, history) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        console.error('❌ [AUTOAI] GROQ_API_KEY not set in environment');
        return null;
    }
    const msgs = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.message })),
        { role: 'user', content: userPrompt }
    ];
    try {
        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama3-70b-8192',
            messages: msgs,
            max_tokens: 250,
            temperature: 0.6
        }, {
            headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            timeout: 12000
        });
        const content = result.data?.choices?.[0]?.message?.content?.trim();
        if (!content) {
            console.error('❌ [AUTOAI] Groq returned empty content — possible content filter or token issue');
            return null;
        }
        return content;
    } catch (e) {
        const errMsg = e.response?.data?.error?.message || e.message;
        console.error('❌ [AUTOAI GROQ ERROR]:', errMsg);
        return null;
    }
}

async function callNexray(prompt) {
    try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 10000);
        let res;
        try {
            res = await fetch(`https://api.nexray.web.id/ai/chatgpt?text=${encodeURIComponent(prompt)}`, { signal: controller.signal });
        } finally {
            clearTimeout(t);
        }
        if (!res.ok) {
            console.error('❌ [AUTOAI NEXRAY] Status:', res.status);
            return null;
        }
        const data = await res.json();
        return data?.result || null;
    } catch (e) {
        console.error('❌ [AUTOAI NEXRAY ERROR]:', e.message);
        return null;
    }
}

module.exports = async (context) => {
    const { client, m, body, prefix, Owner, isAdmin, IsGroup } = context;

    const messageText = (
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        body ||
        m.text ||
        ''
    ).trim();

    if (!messageText) return;

    let prompt = messageText;
    if (IsGroup && prefix && prompt.startsWith(prefix)) {
        prompt = prompt.slice(prefix.length).trim();
    }
    if (!prompt || prompt.length > 1000) return;

    try { await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } }); } catch {}

    const userNum = m.sender.split('@')[0].split(':')[0];
    const userRole = Owner ? 'owner' : isAdmin ? 'group admin' : 'user';
    const chatType = IsGroup ? 'group' : 'DM';

    let history = [];
    try { history = await getConversationHistory(userNum, 6); } catch {}

    const systemPrompt = `You are Toxic-MD, an AI agent for a WhatsApp bot. Detect user intent and map it to bot commands.

USER: ${userRole} | CHAT: ${chatType}

AVAILABLE COMMANDS:
${COMMAND_CATALOG}

INSTRUCTIONS:
- If the user wants to do something a command handles, respond EXACTLY with: CMD:commandname args
- Do NOT include any other text when using CMD: format — just CMD:commandname args
- If truly no command matches, reply in a short savage/funny style (max 100 chars)
- Owner-only commands: ${Owner ? 'ALLOWED for this user' : 'NOT allowed — tell them'}
- Admin commands: ${isAdmin ? 'ALLOWED for this user' : 'NOT allowed in this chat'}`;

    let response = await callGroq(systemPrompt, prompt, history);

    if (!response) {
        console.log('⚠️ [AUTOAI] Groq failed, trying nexray fallback...');
        const shortPrompt = `You are a WhatsApp bot assistant. If the user wants a bot action, say CMD:commandname args. Otherwise reply briefly. User says: ${prompt}`;
        response = await callNexray(shortPrompt);
    }

    if (!response) {
        console.error('❌ [AUTOAI] Both Groq and nexray failed for prompt:', prompt.slice(0, 50));
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
        if (target && typeof target === 'function') {
            try {
                const joinedArgs = cmdArgs.join(' ');
                await target({ ...context, args: cmdArgs, text: joinedArgs, q: joinedArgs, body: joinedArgs });
                try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
            } catch (e) {
                console.error('❌ [AUTOAI CMD ERROR]:', cmdName, e.message);
                try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            }
        } else {
            console.error('❌ [AUTOAI] Command not found:', cmdName, '(resolved:', resolvedName + ')');
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            await client.sendMessage(m.chat, { text: `Couldn't find that command 💀` }, { quoted: m });
        }
    } else {
        try { await client.sendMessage(m.chat, { text: response }, { quoted: m }); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    }
};
