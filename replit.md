# Toxic-v2 WhatsApp Bot

## Overview
A WhatsApp bot built with Baileys (@whiskeysockets/baileys) library, designed for Heroku deployment. The bot provides group management, media downloads, AI features, and various utility commands with a toxic/cranky personality.

## Recent Changes
- **Renamed all directories** to sensible names (Client->src, clintplugins->plugins, Handler->handlers, etc.)
- **Fixed Heroku deployment**: Cleaned package.json, added Procfile, fixed express route for index.html
- **Restyled ALL command outputs** to use `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───` format across 80+ files
- **Fixed listonline command**: Uses proper `presenceSubscribe` to detect online users
- **Fixed demote/promote/remove commands**: Resolved LID vs JID comparison issues
- **Fixed isAdmin/isBotAdmin check** in src/toxic.js
- **Fixed antidelete**: Now shows actual group name
- **Enhanced settings command**: Added descriptive labels
- **Fixed dev command**: Properly sends vCard contact card

## Project Architecture
```
├── src/
│   ├── index.js             - Bot entry point, express server, WhatsApp connection
│   └── toxic.js             - Main message handler, antidelete, command dispatcher
├── handlers/
│   ├── commandHandler.js    - Command registry, aliases
│   ├── connectionHandler.js - WebSocket connection handling
│   ├── eventHandler.js      - Group event handling
│   └── smsg.js              - Message serialization, watermark/reply formatting
├── plugins/                 - All command plugins organized by category
│   ├── General/             - ping, alive, menu, dev, etc.
│   ├── Groups/              - listonline, demote, promote, remove, tagall, etc.
│   ├── Settings/            - settings, autoview, autoread, prefix, mode, etc.
│   ├── Owner/               - Owner-only commands
│   ├── AI/                  - AI commands (gpt, imagine, vision, etc.)
│   ├── Media/               - Download commands (yt, ig, tiktok, etc.)
│   ├── Heroku/              - Heroku management commands
│   ├── Search/              - Search commands (google, movie, etc.)
│   └── Utils/               - Utility commands
├── database/config.js       - Settings, sudo users, banned users management
├── features/                - Feature handlers (antilink, chatbot, status saver, etc.)
├── utils/botUtil/           - Middleware (admin check, owner check, link check)
├── config/settings.js       - Bot name, dev code constants
├── auth/auth.js             - Session authentication
├── lib/                     - Utility libraries (botFunctions, Store, etc.)
└── public/                  - Static web files for express server
```

## Key Design Decisions
- **LID Handling**: WhatsApp uses both JID (phone@s.whatsapp.net) and LID (lid@lid) formats. All admin/bot checks compare number parts using `split('@')[0]` to handle both formats.
- **Presence Detection**: listonline uses `client.presenceSubscribe()` + event listener with 3s timeout
- **Style Format**: All outputs use `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───` with `> 々` line items and `╰──────────────────☉` closing
- **Obfuscated Files**: Do NOT touch `features/antidelete.js` - it is obfuscated. Root `index.js` is now clean (just requires src/index.js)
- **Heroku Optimized**: Designed for Heroku dynos with low memory footprint

## User Preferences
- Toxic/cranky personality in all bot replies
- No comments in code
- Use LID-compatible comparisons everywhere
- Don't break existing functionality
- Sensible directory names
