const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../lib/fastSettings');

module.exports = {
    name: 'help',
    aliases: ['h', 'usage', 'howto'],
    description: 'Shows help and usage for a specific command',
    run: async (context) => {
        const { client, m, args, prefix } = context;

        const settings = await getSettings();
        const effectivePrefix = settings.prefix || prefix || '.';

        const fmt = (title, body) =>
            `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (!args || args.length === 0) {
            const pluginsDir = path.join(__dirname, '..');
            const categories = fs.readdirSync(pluginsDir).filter(f => fs.statSync(path.join(pluginsDir, f)).isDirectory());
            let allCommands = [];
            for (const cat of categories) {
                const files = fs.readdirSync(path.join(pluginsDir, cat)).filter(f => f.endsWith('/js'));
                for (const file of files) {
                    allCommands.push(file.replace('/js', ''));
                }
            }
            allCommands.sort();

            const body = allCommands.map(cmd => `├ *${effectivePrefix}${cmd}*`).join('\n');
            return await client.sendMessage(m.chat, {
                text: fmt('ALL COMMANDS', `├ Total: ${allCommands.length} commands\n├ Use *${effectivePrefix}help <command>* for usage\n├ \n${body}`)
            }, { quoted: m });
        }

        const cmdName = args[0].toLowerCase().replace(/^\./, '');

        const helpData = {
            // ── Anime Commands ─────────────────────────────────────────────
            waifu: { usage: `/waifu`, desc: 'Get a random anime waifu image. Aliases: animegirl, waifupic' },
            neko: { usage: `/neko`, desc: 'Get a random neko (catgirl) image. Aliases: catgirl, nekopic' },
            husbando: { usage: `/husbando`, desc: 'Get a random husbando image. Aliases: animeguy, husbandopic' },
            maid: { usage: `/maid`, desc: 'Get a random anime maid image.' },
            uniform: { usage: `/uniform`, desc: 'Get a random anime uniform image.' },
            // ── Text Effects ────────────────────────────────────────────────
            glossysilver: { usage: `/glossysilver <text>`, desc: 'Generate glossy silver 3D text (max 50 chars).' },
            glitchtext: { usage: `/glitchtext <text>`, desc: 'Generate digital glitch text effect.' },
            advancedglow: { usage: `/advancedglow <text>`, desc: 'Generate advanced glowing text.' },
            neonglitch: { usage: `/neonglitch <text>`, desc: 'Generate neon glitch text effect.' },
            gradienttext: { usage: `/gradienttext <text>`, desc: 'Generate 3D gradient text.' },
            glowingtext: { usage: `/glowingtext <text>`, desc: 'Generate glowing text effect.' },
            luxurygold: { usage: `/luxurygold <text>`, desc: 'Generate luxury gold text.' },
            multicolored: { usage: `/multicolored <text>`, desc: 'Generate multicolored neon text.' },
            galaxytext: { usage: `/galaxytext <text>`, desc: 'Generate galaxy style text wallpaper.' },
            makingneon: { usage: `/makingneon <text>`, desc: 'Generate royal neon text.' },
            writetext: { usage: `/writetext <text>`, desc: 'Generate wet glass text effect.' },
            underwater: { usage: `/underwater <text>`, desc: 'Generate 3D underwater text.' },
            pixelglitch: { usage: `/pixelglitch <text>`, desc: 'Generate pixel glitch text.' },
            summerbeach: { usage: `/summerbeach <text>`, desc: 'Generate summer beach text.' },
            papercut: { usage: `/papercut <text>`, desc: 'Generate 3D paper cut text.' },
            cloudtext: { usage: `/cloudtext <text>`, desc: 'Generate text in clouds effect.' },
            gradientlogo: { usage: `/gradientlogo <text>`, desc: 'Generate 3D gradient logo.' },
            galaxylogo: { usage: `/galaxylogo <text>`, desc: 'Generate galaxy style logo.' },
            colorfulneon: { usage: `/colorfulneon <text>`, desc: 'Generate colorful neon text.' },
            greenneon: { usage: `/greenneon <text>`, desc: 'Generate green neon text.' },
            '1917text': { usage: `/1917text <text>`, desc: 'Generate 1917 war style text.' },
            texteffect: { usage: `/texteffect <text>`, desc: 'Generate 3D hologram text effect.' },
            lighteffect: { usage: `/lighteffect <text>`, desc: 'Generate green light effect text.' },
            bearlogo: { usage: `/bearlogo <text>`, desc: 'Generate a bear mascot logo.' },
            typography: { usage: `/typography <text>`, desc: 'Generate typography pavement text.' },
            hackerneon: { usage: `/hackerneon <text>`, desc: 'Generate hacker cyan neon text.' },
            blackpinklogo: { usage: `/blackpinklogo <text>`, desc: 'Generate Blackpink style logo.' },
            blackpinkstyle: { usage: `/blackpinkstyle <text>`, desc: 'Generate Blackpink style text.' },
            erasertext: { usage: `/erasertext <text>`, desc: 'Generate eraser deleting text effect.' },
            cartoonstyle: { usage: `/cartoonstyle <text>`, desc: 'Generate cartoon graffiti text.' },
            // ── AI Commands ─────────────────────────────────────────────────
            sora: { usage: `/sora <description>`, desc: 'Generate a cinematic AI image scene. Aliases: soraai, aifilm' },
            menu: { usage: `/menu`, desc: 'Shows the main interactive menu with all categories.' },
            fullmenu: { usage: `/fullmenu`, desc: 'Shows all commands listed by category.' },
            help: { usage: `/help [command]`, desc: 'Shows help/usage for all or a specific command.' },
            ping: { usage: `/ping`, desc: 'Check the bot response speed/latency.' },
            alive: { usage: `/alive`, desc: 'Check if the bot is online and running.' },
            uptime: { usage: `/uptime`, desc: 'Shows how long the bot has been running.' },
            settings: { usage: `/settings`, desc: 'View current bot settings.' },
            mode: { usage: `/mode <public|private|sudo>`, desc: 'Change the bot mode. Public = everyone, Private = owner only, Sudo = sudo users too.' },
            prefix: { usage: `/prefix <newprefix>`, desc: 'Change the command prefix.' },
            presence: { usage: `/presence <online|offline|typing|recording>`, desc: 'Set the bot presence status in private chats.' },
            autoread: { usage: `/autoread <on|off>`, desc: 'Auto read private messages.' },
            autoview: { usage: `/autoview <on|off>`, desc: 'Auto view status updates.' },
            autolike: { usage: `/autolike <on|off>`, desc: 'Auto like/react to status updates.' },
            autobio: { usage: `/autobio <on|off>`, desc: 'Auto update bio with current time.' },
            anticall: { usage: `/anticall <on|off>`, desc: 'Auto reject incoming calls and ban caller.' },
            antilink: { usage: `/antilink <delete|remove|off>`, desc: 'Per-group antilink. delete = warn & delete, remove = kick sender, off = disabled. Must be in a group.' },
            antitag: { usage: `/antitag <on|off>`, desc: 'Per-group antitag. Removes members who mass-tag others. Must be in a group.' },
            antistatusmention: { usage: `/antistatusmention <delete|remove|off>`, desc: 'Per-group anti status mention. delete = delete & warn, remove = kick, off = disabled. Must be in a group.' },
            antidelete: { usage: `/antidelete <on|off>`, desc: 'Forward deleted messages to your DM.' },
            antiedit: { usage: `/antiedit <on|off>`, desc: 'Forward original message when someone edits.' },
            antidemote: { usage: `/antidemote <on|off>`, desc: 'Per-group: re-promote admins if someone demotes them.' },
            antipromote: { usage: `/antipromote <on|off>`, desc: 'Per-group: prevent unauthorized promotions.' },
            antiforeign: { usage: `/antiforeign <on|off>`, desc: 'Remove non-local phone numbers from the group.' },
            chatbotpm: { usage: `/chatbotpm <on|off>`, desc: 'Enable AI chatbot in private messages.' },
            gcpresence: { usage: `/gcpresence <on|off>`, desc: 'Set typing/recording presence in groups.' },
            events: { usage: `/events <on|off>`, desc: 'Toggle group join/leave event messages.' },
            stickerwm: { usage: `/stickerwm <packname>`, desc: 'Set custom sticker watermark/packname.' },
            ban: { usage: `/ban @user`, desc: 'Ban a user from using the bot.' },
            unban: { usage: `/unban @user`, desc: 'Unban a previously banned user.' },
            banlist: { usage: `/banlist`, desc: 'View all banned users.' },
            addsudo: { usage: `/addsudo @user`, desc: 'Add a sudo/trusted user.' },
            delsudo: { usage: `/delsudo @user`, desc: 'Remove a sudo user.' },
            checksudo: { usage: `/checksudo`, desc: 'List all sudo users.' },
            sticker: { usage: `/sticker`, desc: 'Convert image/video/gif to sticker. Reply to media.' },
            toimg: { usage: `/toimg`, desc: 'Convert sticker to image. Reply to sticker.' },
            tovid: { usage: `/tovid`, desc: 'Convert sticker/gif to video. Reply to media.' },
            togif: { usage: `/togif`, desc: 'Convert video to GIF.' },
            tts: { usage: `/tts <text>`, desc: 'Convert text to speech audio.' },
            tr: { usage: `/tr <lang> <text>`, desc: 'Translate text. Example: .tr es Hello World' },
            ytmp3: { usage: `/ytmp3 <url|title>`, desc: 'Download YouTube audio as MP3.' },
            ytmp4: { usage: `/ytmp4 <url|title>`, desc: 'Download YouTube video as MP4.' },
            yts: { usage: `/yts <query>`, desc: 'Search YouTube for videos.' },
            tikdl: { usage: `/tikdl <url>`, desc: 'Download TikTok video without watermark.' },
            tikaudio: { usage: `/tikaudio <url>`, desc: 'Download TikTok audio.' },
            igdl: { usage: `/igdl <url>`, desc: 'Download Instagram post/reel.' },
            fbdl: { usage: `/fbdl <url>`, desc: 'Download Facebook video.' },
            twtdl: { usage: `/twtdl <url>`, desc: 'Download Twitter/X video.' },
            spotify: { usage: `/spotify <song name>`, desc: 'Search and download Spotify track.' },
            alldl: { usage: `/alldl <url>`, desc: 'Universal media downloader.' },
            play: { usage: `/play <song name>`, desc: 'Search and play a song.' },
            song: { usage: `/song <title>`, desc: 'Download a song by title.' },
            image: { usage: `/image <query>`, desc: 'Search for images.' },
            video: { usage: `/video <query>`, desc: 'Search for videos.' },
            gpt: { usage: `/gpt <prompt>`, desc: 'Chat with GPT AI.' },
            gemini: { usage: `/gemini <prompt>`, desc: 'Chat with Google Gemini AI.' },
            groq: { usage: `/groq <prompt>`, desc: 'Chat with Groq AI (fast).' },
            darkgpt: { usage: `/darkgpt <prompt>`, desc: 'Chat with DarkGPT (no restrictions).' },
            imagine: { usage: `/imagine <prompt>`, desc: 'Generate AI images from text.' },sora <prompt>`, desc: 'Generate AI video from text.' },
            remini: { usage: `/remini`, desc: 'Enhance/upscale an image. Reply to image.' },
            vision: { usage: `/vision <question>`, desc: 'Ask AI about an image. Reply to image with question.' },
            transcribe: { usage: `/transcribe`, desc: 'Transcribe audio to text. Reply to audio.' },
            tagall: { usage: `/tagall [message]`, desc: 'Tag all group members with optional message.' },
            hidetag: { usage: `/hidetag [message]`, desc: 'Tag all members silently (hidden mention).' },
            promote: { usage: `/promote @user`, desc: 'Make a group member admin.' },
            demote: { usage: `/demote @user`, desc: 'Remove admin from a group member.' },
            remove: { usage: `/remove @user`, desc: 'Remove/kick a member from the group.' },
            add: { usage: `/add <number>`, desc: 'Add a member to the group.' },
            open: { usage: `/open`, desc: 'Open the group to all members.' },
            close: { usage: `/close`, desc: 'Close the group (admins only).' },
            link: { usage: `/link`, desc: 'Get the group invite link.' },
            revoke: { usage: `/revoke`, desc: 'Reset the group invite link.' },
            groupmeta: { usage: `/groupmeta`, desc: 'Show group metadata/info.' },
            gpp: { usage: `/gpp`, desc: 'Get group profile picture.' },
            gstatus: { usage: `/gstatus <text>`, desc: 'Set group description.' },
            listonline: { usage: `/listonline`, desc: 'List online members in group.' },
            requests: { usage: `/requests`, desc: 'View pending join requests.' },
            'approve-all': { usage: `/approve-all`, desc: 'Approve all pending join requests.' },
            'reject-all': { usage: `/reject-all`, desc: 'Reject all pending join requests.' },
            foreigners: { usage: `/foreigners`, desc: 'List non-local phone numbers in group.' },
            xkill: { usage: `/xkill`, desc: 'Kick all non-admin members from the group.' },
            google: { usage: `/google <query>`, desc: 'Search Google.' },
            wiki: { usage: `/wiki <query>`, desc: 'Search Wikipedia.' },
            github: { usage: `/github <username>`, desc: 'Get GitHub user profile.' },
            lyrics: { usage: `/lyrics <song name>`, desc: 'Get song lyrics.' },
            movie: { usage: `/movie <title>`, desc: 'Get movie info.' },
            npm: { usage: `/npm <package>`, desc: 'Get NPM package info.' },
            wallpaper: { usage: `/wallpaper <query>`, desc: 'Search wallpapers.' },
            stickersearch: { usage: `/stickersearch <query>`, desc: 'Search sticker packs.' },
            weather: { usage: `/weather <city>`, desc: 'Get weather info for a city.' },
            dev: { usage: `/dev`, desc: 'Get developer contact info.' },
            support: { usage: `/support`, desc: 'Get support group link.' },
            script: { usage: `/script`, desc: 'Get the bot script/source code link.' },
            credits: { usage: `/credits`, desc: 'Show bot credits.' },
            pair: { usage: `/pair <number>`, desc: 'Pair bot with a WhatsApp number.' },
            update: { usage: `/update`, desc: 'Check for bot updates on Heroku.' },
            setvar: { usage: `/setvar <KEY> <VALUE>`, desc: 'Set a Heroku config var.' },
            getvar: { usage: `/getvar <KEY>`, desc: 'Get a Heroku config var.' },
            allvar: { usage: `/allvar`, desc: 'List all Heroku config vars.' },
            eval: { usage: `/eval <code>`, desc: 'Execute JavaScript code (owner only).' },
            shell: { usage: `/shell <command>`, desc: 'Execute shell commands (owner only).' },
            restart: { usage: `/restart`, desc: 'Restart the bot (owner only).' },
            broadcast: { usage: `/broadcast <message>`, desc: 'Broadcast a message to all chats.' },
            botgc: { usage: `/botgc`, desc: 'List all groups the bot is in.' },
            joingc: { usage: `/joingc <link>`, desc: 'Make bot join a group via invite link.' },
            leavegc: { usage: `/leavegc`, desc: 'Make bot leave the current group.' },
            block: { usage: `/block @user`, desc: 'Block a user.' },
            unblock: { usage: `/unblock @user`, desc: 'Unblock a user.' },
            profile: { usage: `/profile @user`, desc: 'View a user profile/info.' },
            screenshot: { usage: `/screenshot <url>`, desc: 'Take a screenshot of a website.' },
            shorten: { usage: `/shorten <url>`, desc: 'Shorten a long URL.' },
            tinyurl: { usage: `/tinyurl <url>`, desc: 'Shorten URL using TinyURL.' },
            checkid: { usage: `/checkid <group link|channel link>`, desc: 'Get the ID from a group or channel link.' },
            privacy: { usage: `/privacy <setting> <value>`, desc: 'Manage WhatsApp privacy settings.' },
            lastseen: { usage: `/lastseen <on|off>`, desc: 'Toggle last seen visibility.' },
            mypp: { usage: `/mypp`, desc: 'View your own profile picture.' },
            mystatus: { usage: `/mystatus <text>`, desc: 'Set your WhatsApp status/about.' },
            online: { usage: `/online <on|off>`, desc: 'Toggle online status.' },
            groupadd: { usage: `/groupadd <on|off>`, desc: 'Control who can add the bot to groups.' },
            del: { usage: `/del`, desc: 'Delete a message. Reply to the message to delete.' },
            retrieve: { usage: `/retrieve`, desc: 'Retrieve/reveal a view-once message.' },
            fetch: { usage: `/fetch <url>`, desc: 'Fetch data from a URL.' },
            upload: { usage: `/upload`, desc: 'Upload media to get a URL. Reply to media.' },
            mediafire: { usage: `/mediafire <url>`, desc: 'Download from Mediafire.' },
            apk: { usage: `/apk <app name>`, desc: 'Download an APK.' },
            gitclone: { usage: `/gitclone <url>`, desc: 'Clone a GitHub repository.' },
            pinterest: { usage: `/pinterest <query>`, desc: 'Search Pinterest images.' },
            shazam: { usage: `/shazam`, desc: 'Identify a song from audio. Reply to audio.' },
            carbon: { usage: `/carbon <code>`, desc: 'Generate a Carbon code image.' },
            encrypt: { usage: `/encrypt <text>`, desc: 'Encrypt text.' },
            'run-js': { usage: `/run-js <code>`, desc: 'Run JavaScript code.' },
            'run-py': { usage: `/run-py <code>`, desc: 'Run Python code.' },
            hentai: { usage: `/hentai`, desc: 'NSFW content (18+ groups only).' },
            xvideos: { usage: `/xvideos <query>`, desc: 'NSFW content search (18+ groups only).' },
            vvx: { usage: `/vvx`, desc: 'View view-once messages. Reply to view-once.' },
        };

        if (helpData[cmdName]) {
            const info = helpData[cmdName];
            const body = `├ 📌 *Command:* ${cmdName}\n├ 📖 *Usage:* ${info.usage}\n├ ℹ️ *Description:*\n├ ${info.desc}`;
            return await client.sendMessage(m.chat, { text: fmt(`HELP: ${cmdName.toUpperCase()}`, body) }, { quoted: m });
        }

        const pluginsDir = path.join(__dirname, '..');
        const categories = fs.readdirSync(pluginsDir).filter(f => fs.statSync(path.join(pluginsDir, f)).isDirectory());
        let found = false;
        for (const cat of categories) {
            const files = fs.readdirSync(path.join(pluginsDir, cat)).filter(f => f.endsWith('/js'));
            if (files.includes(cmdName + '/js')) {
                found = true;
                const body = `├ 📌 *Command:* ${cmdName}\n├ 📁 *Category:* ${cat}\n├ 📖 *Usage:* ${effectivePrefix}${cmdName}\n├ ℹ️ No detailed help available for this command yet.`;
                return await client.sendMessage(m.chat, { text: fmt(`HELP: ${cmdName.toUpperCase()}`, body) }, { quoted: m });
            }
        }

        if (!found) {
            await client.sendMessage(m.chat, {
                text: fmt('HELP', `├ ❌ Command "*${cmdName}*" not found.\n├ Use *${effectivePrefix}help* to list all commands.`)
            }, { quoted: m });
        }
    }
};
