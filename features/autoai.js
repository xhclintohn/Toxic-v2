const axios = require('axios');
const fetch = require('node-fetch');
const { commands, aliases } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

const COMMAND_CATALOG = `
DOWNLOADS & MEDIA:
- play <song name or youtube link> → play/download a song
- ytmp3 <url> → download youtube audio
- ytmp4 <url> → download youtube video  
- yt <query> → search youtube
- yts <query> → youtube search results
- spotify <url or song name> → download spotify track
- tikdl <url> → download tiktok video
- tikaudio <url> → download tiktok audio only
- igdl <url> → download instagram reel/post
- fbdl <url> → download facebook video
- twtdl <url> → download twitter/X video
- pinterest <query> → search pinterest images
- image <query> → search and download image
- alldl <url> → download from any link
- mediafire <url> → download mediafire file
- apk <app name> → download android apk
- shazam → identify playing song (reply to audio)

AI TOOLS:
- gpt <prompt> → ask ChatGPT
- groq <prompt> → ask Groq AI
- gemini <prompt> → ask Google Gemini
- imagine <prompt> → generate AI image
- vision → analyze image with AI (reply to image)
- remini → enhance/upscale image quality (reply to image)
- aicode <prompt> → generate code with AI
- darkgpt <prompt> → uncensored AI chat
- transcribe → transcribe voice note to text (reply to audio)
- stt → speech to text (reply to voice)
- codegen <description> → generate code

EDITING & STICKERS:
- sticker → convert image/gif/video to sticker
- toimg → convert sticker to image
- tts <text> → text to speech audio
- removebg → remove image background (reply to image)
- imgedit <prompt> → edit image with AI (reply to image)
- togif → convert video to gif
- tofigure → make toon figure from image
- toghibli → ghibli style filter
- toanime → anime style filter
- brat <text> → brat text meme
- rip → rest in peace meme (reply to image)
- trigger → triggered gif
- trash → trash meme
- shit → sh*t meme
- wanted → wanted poster
- wasted → wasted meme
- emix <emoji> → emoji mix
- logogen <text> → generate logo text
- tts <text> → text to speech
- carbon <code> → beautiful code screenshot
- encrypt <text> → encrypt text

SEARCH & INFO:
- google <query> → google search
- wiki <topic> → wikipedia summary
- lyrics <song> → get song lyrics
- movie <title> → movie info
- song <query> → search for a song
- weather <city> → weather forecast
- wallpaper <query> → download wallpaper
- npm <package> → npm package info
- technews → latest tech news
- screenshot <url> → screenshot a website
- shorten <url> → shorten a link
- github <user/repo> → github info

GENERAL:
- menu → show all commands
- ping → check bot speed
- alive → check bot is alive
- uptime → bot uptime
- tr <lang> <text> → translate text (e.g. tr es hello)
- fancy <1-20> <text> → fancy text styles
- vcf <number> → create contact card
- tempmail → get temp email
- profile → see your profile
- pair <number> → pair with someone
- advice → get random advice
- catfact → cat fact
- fact → random fact
- gaycheck → fun gay check
- random-anime → random anime image

GROUPS (admin/owner required for some):
- tagall <msg> → tag all members
- hidetag <msg> → tag all silently
- add <number> → add member to group
- remove @user → remove/kick member
- promote @user → make admin
- demote @user → remove admin
- link → get group invite link
- revoke → reset group link
- close → close group (admin only)
- open → open group (admin only)
- poll <question|option1|option2> → create poll
- pin → pin a message (reply to msg)
- clear → clear all messages
- groupmeta → show group info
- afk <reason> → set AFK status

SETTINGS (owner only):
- prefix <symbol> → change command prefix
- mode <public/private/group/inbox> → bot mode
- autoview on/off → auto view status
- autolike on/off → auto like status
- autoread on/off → auto read messages
- antidelete on/off → anti delete messages
- antitag on/off → anti-tag protection
- stealth on/off → stealth mode
- chatbotpm on/off → DM chatbot
- autoai on/off → this AI agent
- addsudo <number> → add sudo user
- delsudo <number> → remove sudo user
- ban @user → ban user
- unban @user → unban user
`;

async function callGroq(messagesArr) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return null;
    try {
        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama3-70b-8192',
            messages: messagesArr,
            max_tokens: 250,
            temperature: 0.7
        }, {
            headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            timeout: 12000
        });
        return result.data?.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error('❌ [AUTOAI GROQ]:', e.response?.data?.error?.message || e.message);
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
        if (!res.ok) return null;
        const data = await res.json();
        return data?.result || null;
    } catch (e) {
        console.error('❌ [AUTOAI NEXRAY]:', e.message);
        return null;
    }
}

module.exports = async (context) => {
    const { client, m, body, prefix, Owner, isAdmin, isBotAdmin, IsGroup } = context;

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
    const userRole = Owner ? 'owner/sudo' : isAdmin ? 'group admin' : 'regular user';
    const chatType = IsGroup ? 'group' : 'DM';

    let history = [];
    try { history = await getConversationHistory(userNum, 6); } catch {}

    const systemPrompt = `You are Toxic-MD, an AI agent for a WhatsApp bot. Your job is to detect user intent and execute bot commands.

USER ROLE: ${userRole} | CHAT: ${chatType}

COMMAND CATALOG:
${COMMAND_CATALOG}

RULES (follow strictly):
1. If the user's message matches ANY command intent above, respond ONLY with: CMD:commandname args
   - Extract the exact command name from the catalog
   - Put all relevant args after the command name
   - Do NOT add any other text, just CMD:commandname args
2. Only if no command matches, reply casually in savage toxic style (max 120 chars)
3. For owner-only commands: ${Owner ? 'this user IS owner, allow all' : 'this user is NOT owner, tell them they need to be owner'}
4. For admin commands in groups: ${isAdmin ? 'this user IS admin' : 'this user is NOT admin'}

EXAMPLES:
"play despacito" → CMD:play despacito
"download this tiktok https://..." → CMD:tikdl https://...
"make a sticker" → CMD:sticker
"translate to spanish: hello" → CMD:tr es hello
"who sings this song?" (replying to audio) → CMD:shazam
"what's the weather in Lagos?" → CMD:weather Lagos
"search google for best phones 2025" → CMD:google best phones 2025
"remove background from this image" → CMD:removebg
"enhance this image" → CMD:remini
"tag everyone" → CMD:tagall
"close the group" → CMD:close
"what is quantum physics" → CMD:wiki quantum physics
"get lyrics of Blinding Lights" → CMD:lyrics Blinding Lights
"turn on autoview" → CMD:autoview on
"make this a sticker" → CMD:sticker
"hey how are you" → Doing fine unlike your brain cells 💀`;

    const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.message })),
        { role: 'user', content: prompt }
    ];

    let response = await callGroq(groqMessages);

    if (!response) {
        const fallbackPrompt = `${systemPrompt}\n\nUser: ${prompt}\nRespond with CMD:commandname args if it matches a command, otherwise reply casually:`;
        response = await callNexray(fallbackPrompt);
    }

    if (!response) {
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
                console.error('❌ [AUTOAI CMD ERROR]:', e.message);
                try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            }
        } else {
            console.error('❌ [AUTOAI] Unknown command:', cmdName, '→', resolvedName);
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            await client.sendMessage(m.chat, { text: `Can't find that command 💀 Try asking differently` }, { quoted: m });
        }
    } else {
        try { await client.sendMessage(m.chat, { text: response }, { quoted: m }); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    }
};
