const axios = require('axios');
const { commands, aliases } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

const COMMAND_CATALOG = `
MUSIC & DOWNLOADS:
- play <song name or youtube url> → play or download a song
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
- groq <prompt> → ask Groq AI directly
- gemini <prompt> → ask Google Gemini
- imagine <prompt> → generate AI image from text
- vision → analyze image with AI (reply to image)
- remini → enhance or upscale image to HD (reply to image)
- aicode <prompt> → generate code with AI
- transcribe → transcribe voice note to text (reply to audio)
- stt → speech to text (reply to voice message)
- codegen <description> → generate code

STICKERS & EDITING:
- sticker → convert image/gif/video to sticker
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
- github <user or repo> → github profile or repo info

GENERAL:
- menu → show all bot commands
- ping → check bot speed
- alive → check if bot is online
- uptime → bot uptime
- tr <lang> <text> → translate text (e.g. tr es hello)
- fancy <1-20> <text> → fancy text styles
- vcf <number> → create contact card
- tempmail → get temporary email
- profile → view your bot profile
- advice → random advice
- catfact → random cat fact
- fact → random fact
- weather <city> → get weather info

GROUPS (some need admin):
- tagall <message> → tag all group members
- hidetag <message> → tag all silently
- add <number> → add member to group
- remove @user → kick member from group
- promote @user → make member an admin
- demote @user → remove admin from member
- link → get group invite link
- revoke → reset group invite link
- close → lock group (admins only)
- open → unlock group (admins only)
- poll <question|opt1|opt2> → create a poll
- pin → pin a message (reply to msg)
- clear → delete all messages
- groupmeta → show group info
- afk <reason> → set AFK status
- hug @user → hug someone
- kiss @user → kiss someone
- slap @user → slap someone

SETTINGS (owner only):
- prefix <symbol> → change command prefix
- mode <public/private/group/inbox> → set bot mode
- autoview on/off → auto view status
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

module.exports = async (context) => {
    const { client, m, body, prefix, Owner, isAdmin, IsGroup } = context;

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        console.error('❌ [AUTOAI] GROQ_API_KEY is not set in environment variables');
        try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
        return;
    }

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

    console.log(`🤖 [AUTOAI] Processing: "${prompt.slice(0, 80)}" from ${m.sender.split('@')[0]}`);
    try { await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } }); } catch {}

    const userNum = m.sender.split('@')[0].split(':')[0];
    const userRole = Owner ? 'owner' : isAdmin ? 'group admin' : 'user';
    const chatType = IsGroup ? 'group' : 'DM';

    let history = [];
    try { history = await getConversationHistory(userNum, 6); } catch (e) {
        console.error('❌ [AUTOAI] Failed to get history:', e.message);
    }

    const systemPrompt = `You are Toxic-MD, an AI agent controlling a WhatsApp bot. Your job is to detect user intent and map it to bot commands.

USER ROLE: ${userRole} | CHAT TYPE: ${chatType}

AVAILABLE COMMANDS:
${COMMAND_CATALOG}

STRICT RULES:
1. When the user's message matches any command intent, respond ONLY with: CMD:commandname args
   - Use the exact command name from the list above
   - Put all arguments after the command name separated by spaces
   - Do NOT add any other text — just CMD:commandname args
2. Only if genuinely no command matches, reply briefly in savage style (max 100 chars)
3. Owner-only commands (prefix/mode/autoai/addsudo/delsudo/ban/unban): ${Owner ? 'this user IS owner, ALLOW' : 'NOT owner, refuse politely'}
4. Admin commands in groups: ${isAdmin ? 'this user IS admin, ALLOW' : 'this user is NOT admin'}

EXAMPLES:
"play Acapulco" → CMD:play Acapulco
"hey kindly play Acapulco" → CMD:play Acapulco
"download this song alone by ava max" → CMD:play alone ava max
"make sticker" → CMD:sticker
"translate to french: hello" → CMD:tr fr hello
"weather in Lagos" → CMD:weather Lagos
"tag everyone" → CMD:tagall
"enhance this image" → CMD:remini
"remove background" → CMD:removebg
"search google for best phones 2025" → CMD:google best phones 2025
"get lyrics of Blinding Lights" → CMD:lyrics Blinding Lights
"how are you" → Surviving unlike your search history 💀`;

    const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.message })),
        { role: 'user', content: prompt }
    ];

    let response;
    try {
        console.log(`🤖 [AUTOAI] Calling Groq API (key length: ${groqKey.length})...`);
        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            max_tokens: 250,
            temperature: 0.6
        }, {
            headers: {
                Authorization: `Bearer ${groqKey}`,
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
            await client.sendMessage(m.chat, { text: `Couldn't find that command 💀` }, { quoted: m });
        }
    } else {
        try { await client.sendMessage(m.chat, { text: response }, { quoted: m }); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    }
};
