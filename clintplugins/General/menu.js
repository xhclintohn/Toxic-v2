const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays the Toxic-MD command menu with interactive buttons',
  run: async (context) => {
    const { client, m, mode, pict, botname, text, prefix } = context;

    if (text) {
      await client.sendMessage(
        m.chat,
        {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo ${m.pushName}, what's with the extra bullshit? Just say *${prefix}menu*, moron. 🖕\n┗━━━━━━━━━━━━━━━┛`,
        },
        { quoted: m, ad: true }
      );
      return;
    }

    const settings = await getSettings();
    const effectivePrefix = settings.prefix || '.'; // Dynamic prefix from database

    // Menu text
    const menuText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *( 💬 ) - Hello, @${m.pushName}* Welcome to the bots Menu\n\n` + 
      `- 計さ Bot INFORMATION✓\n\n` +
      `⌬ *Bσƚ*: \n` +
      `𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 (bow down)\n` +

      `⌬ *Pɾҽϝιx*: \n` +
      `${effectivePrefix} (learn it, dumbass)\n` +

      `⌬ *Mσԃҽ*: \n` +
      `${mode} ( ! )\n` +

      `\n◈━━━━━━━━━━━━━━━━◈\n\n` +
      ` ( ! ) *Select a button below.* `;

    // Interactive message with buttons as per new format
    const msg = generateWAMessageFromContent(
      m.chat,
      {
        interactiveMessage: {
          header: "Welcome to Toxic-MD",
          title: "Main Menu",
          footer: "Pσɯҽɾҽԃ Ⴆყ Toxic-MD",
          image: { url: "https://example.com/image.jpg" },
          nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
              limited_time_offer: {
                text: "Exclusive offer just for you!",
                url: "https://t.me/xhclintohn",
                copy_code: "TOXIC",
                expiration_time: Date.now() * 999
              },
              bottom_sheet: {
                in_thread_buttons_limit: 2,
                divider_indices: [1, 2, 3, 4],
                list_title: "Select a Command",
                button_title: "Toxic-MD Options"
              },
              tap_target_configuration: {
                title: "X",
                description: "Unlock more features",
                canonical_url: "https://t.me/xhclintohn",
                domain: "https://example.com",
                button_index: 0
              }
            }),
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  has_multiple_buttons: true
                })
              },
              {
                name: "call_permission_request",
                buttonParamsJson: JSON.stringify({
                  has_multiple_buttons: true
                })
              },
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "Core Commands",
                  sections: [
                    {
                      title: "Main Commands",
                      highlight_label: "✨",
                      rows: [
                        { title: 'Full Menu', description: 'All commands listed', id: `${prefix}fullmenu` },
                        { title: 'Developer', description: 'Dev-specific commands', id: `${prefix}dev` }
                      ]
                    }
                  ],
                  has_multiple_buttons: true
                })
              },
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "Copy Code",
                  id: "123456789",
                  copy_code: "TOXIC"
                })
              }
            ]
          }
        }
      },
      { quoted: m }
    );

    await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    // Audio message logic (optional)
    const possibleAudioPaths = [
      path.join(__dirname, 'xh_clinton', 'menu.mp3'),
      path.join(process.cwd(), 'xh_clinton', 'menu.mp3'),
      path.join(__dirname, '..', 'xh_clinton', 'menu.mp3'),
    ];

    let audioPath = null;
    for (const possiblePath of possibleAudioPaths) {
      if (fs.existsSync(possiblePath)) {
        audioPath = possiblePath;
        break;
      }
    }

    if (audioPath) {
      await client.sendMessage(
        m.chat,
        {
          audio: { url: audioPath },
          ptt: true,
          mimetype: 'audio/mpeg',
          fileName: 'menu.mp3',
        },
        { quoted: m }
      );
    }
  },
};