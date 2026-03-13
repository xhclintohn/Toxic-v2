const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../database/config');

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
                const files = fs.readdirSync(path.join(pluginsDir, cat)).filter(f => f.endsWith('.js'));
                for (const file of files) {
                    allCommands.push(file.replace('.js', ''));
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
            menu: { usage: `${effectivePrefix}menu`, desc: 'Shows the main interactive menu with all categories.' },
            fullmenu: { usage: `${effectivePrefix}fullmenu`, desc: 'Shows all commands listed by category.' },
            help: { usage: `${effectivePrefix}help [command]`, desc: 'Shows help/usage for all or a specific command.' },
            ping: { usage: `${effectivePrefix}ping`, desc: 'Check the bot response speed/latency.' },
            alive: { usage: `${effectivePrefix}alive`, desc: 'Check if the bot is online and running.' },
            uptime: { usage: `${effectivePrefix}uptime`, desc: 'Shows how long the bot has been running.' },
            settings: { usage: `${effectivePrefix}settings`, desc: 'View current bot settings.' },
            mode: { usage: `${effectivePrefix}mode <public|private|sudo>`, desc: 'Change the bot mode. Public = everyone, Private = owner only, Sudo = sudo users too.' },
            prefix: { usage: `${effectivePrefix}prefix <newprefix>`, desc: 'Change the command prefix.' },
            presence: { usage: `${effectivePrefix}presence <online|offline|typing|recording>`, desc: 'Set the bot presence status in private chats.' },
            autoread: { usage: `${effectivePrefix}autoread <on|off>`, desc: 'Auto read private messages.' },
            autoview: { usage: `${effectivePrefix}autoview <on|off>`, desc: 'Auto view status updates.' },
            autolike: { usage: `${effectivePrefix}autolike <on|off>`, desc: 'Auto like/react to status updates.' },
            autobio: { usage: `${effectivePrefix}autobio <on|off>`, desc: 'Auto update bio with current time.' },
            anticall: { usage: `${effectivePrefix}anticall <on|off>`, desc: 'Auto reject incoming calls and ban caller.' },
            antilink: { usage: `${effectivePrefix}antilink <delete|remove|off>`, desc: 'Per-group antilink. delete = warn & delete, remove = kick sender, off = disabled. Must be in a group.' },
            antitag: { usage: `${effectivePrefix}antitag <on|off>`, desc: 'Per-group antitag. Removes members who mass-tag others. Must be in a group.' },
            antistatusmention: { usage: `${effectivePrefix}antistatusmention <delete|remove|off>`, desc: 'Per-group anti status mention. delete = delete & warn, remove = kick, off = disabled. Must be in a group.' },
            antidelete: { usage: `${effectivePrefix}antidelete <on|off>`, desc: 'Forward deleted messages to your DM.' },
            antiedit: { usage: `${effectivePrefix}antiedit <on|off>`, desc: 'Forward original message when someone edits.' },
            antidemote: { usage: `${effectivePrefix}antidemote <on|off>`, desc: 'Per-group: re-promote admins if someone demotes them.' },
            antipromote: { usage: `${effectivePrefix}antipromote <on|off>`, desc: 'Per-group: prevent unauthorized promotions.' },
            antiforeign: { usage: `${effectivePrefix}antiforeign <on|off>`, desc: 'Remove non-local phone numbers from the group.' },
            chatbotpm: { usage: `${effectivePrefix}chatbotpm <on|off>`, desc: 'Enable AI chatbot in private messages.' },
            gcpresence: { usage: `${effectivePrefix}gcpresence <on|off>`, desc: 'Set typing/recording presence in groups.' },
            events: { usage: `${effectivePrefix}events <on|off>`, desc: 'Toggle group join/leave event messages.' },
            stickerwm: { usage: `${effectivePrefix}stickerwm <packname>`, desc: 'Set custom sticker watermark/packname.' },
            ban: { usage: `${effectivePrefix}ban @user`, desc: 'Ban a user from using the bot.' },
            unban: { usage: `${effectivePrefix}unban @user`, desc: 'Unban a previously banned user.' },
            banlist: { usage: `${effectivePrefix}banlist`, desc: 'View all banned users.' },
            addsudo: { usage: `${effectivePrefix}addsudo @user`, desc: 'Add a sudo/trusted user.' },
            delsudo: { usage: `${effectivePrefix}delsudo @user`, desc: 'Remove a sudo user.' },
            checksudo: { usage: `${effectivePrefix}checksudo`, desc: 'List all sudo users.' },
            sticker: { usage: `${effectivePrefix}sticker`, desc: 'Convert image/video/gif to sticker. Reply to media.' },
            toimg: { usage: `${effectivePrefix}toimg`, desc: 'Convert sticker to image. Reply to sticker.' },
            tovid: { usage: `${effectivePrefix}tovid`, desc: 'Convert sticker/gif to video. Reply to media.' },
            togif: { usage: `${effectivePrefix}togif`, desc: 'Convert video to GIF.' },
            tts: { usage: `${effectivePrefix}tts <text>`, desc: 'Convert text to speech audio.' },
            tr: { usage: `${effectivePrefix}tr <lang> <text>`, desc: 'Translate text. Example: .tr es Hello World' },
            ytmp3: { usage: `${effectivePrefix}ytmp3 <url|title>`, desc: 'Download YouTube audio as MP3.' },
            ytmp4: { usage: `${effectivePrefix}ytmp4 <url|title>`, desc: 'Download YouTube video as MP4.' },
            yts: { usage: `${effectivePrefix}yts <query>`, desc: 'Search YouTube for videos.' },
            tikdl: { usage: `${effectivePrefix}tikdl <url>`, desc: 'Download TikTok video without watermark.' },
            tikaudio: { usage: `${effectivePrefix}tikaudio <url>`, desc: 'Download TikTok audio.' },
            igdl: { usage: `${effectivePrefix}igdl <url>`, desc: 'Download Instagram post/reel.' },
            fbdl: { usage: `${effectivePrefix}fbdl <url>`, desc: 'Download Facebook video.' },
            twtdl: { usage: `${effectivePrefix}twtdl <url>`, desc: 'Download Twitter/X video.' },
            spotify: { usage: `${effectivePrefix}spotify <song name>`, desc: 'Search and download Spotify track.' },
            alldl: { usage: `${effectivePrefix}alldl <url>`, desc: 'Universal media downloader.' },
            play: { usage: `${effectivePrefix}play <song name>`, desc: 'Search and play a song.' },
            song: { usage: `${effectivePrefix}song <title>`, desc: 'Download a song by title.' },
            image: { usage: `${effectivePrefix}image <query>`, desc: 'Search for images.' },
            video: { usage: `${effectivePrefix}video <query>`, desc: 'Search for videos.' },
            gpt: { usage: `${effectivePrefix}gpt <prompt>`, desc: 'Chat with GPT AI.' },
            gemini: { usage: `${effectivePrefix}gemini <prompt>`, desc: 'Chat with Google Gemini AI.' },
            groq: { usage: `${effectivePrefix}groq <prompt>`, desc: 'Chat with Groq AI (fast).' },
            darkgpt: { usage: `${effectivePrefix}darkgpt <prompt>`, desc: 'Chat with DarkGPT (no restrictions).' },
            imagine: { usage: `${effectivePrefix}imagine <prompt>`, desc: 'Generate AI images from text.' },
            sora: { usage: `${effectivePrefix}sora <prompt>`, desc: 'Generate AI video from text.' },
            remini: { usage: `${effectivePrefix}remini`, desc: 'Enhance/upscale an image. Reply to image.' },
            vision: { usage: `${effectivePrefix}vision <question>`, desc: 'Ask AI about an image. Reply to image with question.' },
            transcribe: { usage: `${effectivePrefix}transcribe`, desc: 'Transcribe audio to text. Reply to audio.' },
            tagall: { usage: `${effectivePrefix}tagall [message]`, desc: 'Tag all group members with optional message.' },
            hidetag: { usage: `${effectivePrefix}hidetag [message]`, desc: 'Tag all members silently (hidden mention).' },
            promote: { usage: `${effectivePrefix}promote @user`, desc: 'Make a group member admin.' },
            demote: { usage: `${effectivePrefix}demote @user`, desc: 'Remove admin from a group member.' },
            remove: { usage: `${effectivePrefix}remove @user`, desc: 'Remove/kick a member from the group.' },
            add: { usage: `${effectivePrefix}add <number>`, desc: 'Add a member to the group.' },
            open: { usage: `${effectivePrefix}open`, desc: 'Open the group to all members.' },
            close: { usage: `${effectivePrefix}close`, desc: 'Close the group (admins only).' },
            link: { usage: `${effectivePrefix}link`, desc: 'Get the group invite link.' },
            revoke: { usage: `${effectivePrefix}revoke`, desc: 'Reset the group invite link.' },
            groupmeta: { usage: `${effectivePrefix}groupmeta`, desc: 'Show group metadata/info.' },
            gpp: { usage: `${effectivePrefix}gpp`, desc: 'Get group profile picture.' },
            gstatus: { usage: `${effectivePrefix}gstatus <text>`, desc: 'Set group description.' },
            listonline: { usage: `${effectivePrefix}listonline`, desc: 'List online members in group.' },
            requests: { usage: `${effectivePrefix}requests`, desc: 'View pending join requests.' },
            'approve-all': { usage: `${effectivePrefix}approve-all`, desc: 'Approve all pending join requests.' },
            'reject-all': { usage: `${effectivePrefix}reject-all`, desc: 'Reject all pending join requests.' },
            foreigners: { usage: `${effectivePrefix}foreigners`, desc: 'List non-local phone numbers in group.' },
            xkill: { usage: `${effectivePrefix}xkill`, desc: 'Kick all non-admin members from the group.' },
            google: { usage: `${effectivePrefix}google <query>`, desc: 'Search Google.' },
            wiki: { usage: `${effectivePrefix}wiki <query>`, desc: 'Search Wikipedia.' },
            github: { usage: `${effectivePrefix}github <username>`, desc: 'Get GitHub user profile.' },
            lyrics: { usage: `${effectivePrefix}lyrics <song name>`, desc: 'Get song lyrics.' },
            movie: { usage: `${effectivePrefix}movie <title>`, desc: 'Get movie info.' },
            npm: { usage: `${effectivePrefix}npm <package>`, desc: 'Get NPM package info.' },
            wallpaper: { usage: `${effectivePrefix}wallpaper <query>`, desc: 'Search wallpapers.' },
            stickersearch: { usage: `${effectivePrefix}stickersearch <query>`, desc: 'Search sticker packs.' },
            weather: { usage: `${effectivePrefix}weather <city>`, desc: 'Get weather info for a city.' },
            dev: { usage: `${effectivePrefix}dev`, desc: 'Get developer contact info.' },
            support: { usage: `${effectivePrefix}support`, desc: 'Get support group link.' },
            script: { usage: `${effectivePrefix}script`, desc: 'Get the bot script/source code link.' },
            credits: { usage: `${effectivePrefix}credits`, desc: 'Show bot credits.' },
            pair: { usage: `${effectivePrefix}pair <number>`, desc: 'Pair bot with a WhatsApp number.' },
            update: { usage: `${effectivePrefix}update`, desc: 'Check for bot updates on Heroku.' },
            setvar: { usage: `${effectivePrefix}setvar <KEY> <VALUE>`, desc: 'Set a Heroku config var.' },
            getvar: { usage: `${effectivePrefix}getvar <KEY>`, desc: 'Get a Heroku config var.' },
            allvar: { usage: `${effectivePrefix}allvar`, desc: 'List all Heroku config vars.' },
            eval: { usage: `${effectivePrefix}eval <code>`, desc: 'Execute JavaScript code (owner only).' },
            shell: { usage: `${effectivePrefix}shell <command>`, desc: 'Execute shell commands (owner only).' },
            restart: { usage: `${effectivePrefix}restart`, desc: 'Restart the bot (owner only).' },
            broadcast: { usage: `${effectivePrefix}broadcast <message>`, desc: 'Broadcast a message to all chats.' },
            botgc: { usage: `${effectivePrefix}botgc`, desc: 'List all groups the bot is in.' },
            joingc: { usage: `${effectivePrefix}joingc <link>`, desc: 'Make bot join a group via invite link.' },
            leavegc: { usage: `${effectivePrefix}leavegc`, desc: 'Make bot leave the current group.' },
            block: { usage: `${effectivePrefix}block @user`, desc: 'Block a user.' },
            unblock: { usage: `${effectivePrefix}unblock @user`, desc: 'Unblock a user.' },
            profile: { usage: `${effectivePrefix}profile @user`, desc: 'View a user profile/info.' },
            screenshot: { usage: `${effectivePrefix}screenshot <url>`, desc: 'Take a screenshot of a website.' },
            shorten: { usage: `${effectivePrefix}shorten <url>`, desc: 'Shorten a long URL.' },
            tinyurl: { usage: `${effectivePrefix}tinyurl <url>`, desc: 'Shorten URL using TinyURL.' },
            checkid: { usage: `${effectivePrefix}checkid <group link|channel link>`, desc: 'Get the ID from a group or channel link.' },
            privacy: { usage: `${effectivePrefix}privacy <setting> <value>`, desc: 'Manage WhatsApp privacy settings.' },
            lastseen: { usage: `${effectivePrefix}lastseen <on|off>`, desc: 'Toggle last seen visibility.' },
            mypp: { usage: `${effectivePrefix}mypp`, desc: 'View your own profile picture.' },
            mystatus: { usage: `${effectivePrefix}mystatus <text>`, desc: 'Set your WhatsApp status/about.' },
            online: { usage: `${effectivePrefix}online <on|off>`, desc: 'Toggle online status.' },
            groupadd: { usage: `${effectivePrefix}groupadd <on|off>`, desc: 'Control who can add the bot to groups.' },
            del: { usage: `${effectivePrefix}del`, desc: 'Delete a message. Reply to the message to delete.' },
            retrieve: { usage: `${effectivePrefix}retrieve`, desc: 'Retrieve/reveal a view-once message.' },
            fetch: { usage: `${effectivePrefix}fetch <url>`, desc: 'Fetch data from a URL.' },
            upload: { usage: `${effectivePrefix}upload`, desc: 'Upload media to get a URL. Reply to media.' },
            mediafire: { usage: `${effectivePrefix}mediafire <url>`, desc: 'Download from Mediafire.' },
            apk: { usage: `${effectivePrefix}apk <app name>`, desc: 'Download an APK.' },
            gitclone: { usage: `${effectivePrefix}gitclone <url>`, desc: 'Clone a GitHub repository.' },
            pinterest: { usage: `${effectivePrefix}pinterest <query>`, desc: 'Search Pinterest images.' },
            shazam: { usage: `${effectivePrefix}shazam`, desc: 'Identify a song from audio. Reply to audio.' },
            carbon: { usage: `${effectivePrefix}carbon <code>`, desc: 'Generate a Carbon code image.' },
            encrypt: { usage: `${effectivePrefix}encrypt <text>`, desc: 'Encrypt text.' },
            'run-js': { usage: `${effectivePrefix}run-js <code>`, desc: 'Run JavaScript code.' },
            'run-py': { usage: `${effectivePrefix}run-py <code>`, desc: 'Run Python code.' },
            hentai: { usage: `${effectivePrefix}hentai`, desc: 'NSFW content (18+ groups only).' },
            xvideos: { usage: `${effectivePrefix}xvideos <query>`, desc: 'NSFW content search (18+ groups only).' },
            vvx: { usage: `${effectivePrefix}vvx`, desc: 'View view-once messages. Reply to view-once.' },
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
            const files = fs.readdirSync(path.join(pluginsDir, cat)).filter(f => f.endsWith('.js'));
            if (files.includes(cmdName + '.js')) {
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
