const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays the Toxic-MD command menu with interactive buttons',
  run: async (context) => {
    const { client: sock, m, mode, pict, botname, text, prefix } = context;

    if (text) {
      await sock.sendMessage(
        m.chat,
        {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo ${m.pushName}, what's with the extra bullshit? Just say *${prefix}menu*, moron.\n┗━━━━━━━━━━━━━━━┛`,
        },
        { quoted: m, ad: true }
      );
      return;
    }

    const settings = await getSettings();
    const effectivePrefix = settings.prefix || '.'; 

    const ownername = "xh_clinton"; 

    await sock.relayMessage(m.chat, {
      interactiveMessage: {
        contextInfo: {
          mentionedJid: [m.sender],
          externalAdReply: {
            title: ownername,
            body: '',
            thumbnailUrl: "https://qu.ax/XxQwp.jpg",
            sourceUrl: `https://toxicmd.site`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        },
        header: {
          documentMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc",
            mimetype: "application/pdf",
            fileSha256: "+gmvvCB6ckJSuuG3ZOzHsTBgRAukejv1nnfwGSSSS/4=",
            fileLength: "999999999999",
            pageCount: 0,
            mediaKey: "MWO6fI223TY8T0i9onNcwNBBPldWfwp1j1FPKCiJFzw=",
            fileName: "ToxicMDz",
            fileEncSha256: "ZS8v9tio2un1yWVOOG3lwBxiP+mNgaKPY9+wl5pEoi8=",
            directPath: "/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc",
            mediaKeyTimestamp: "1756370084",
          },
          hasMediaAttachment: true,
        },
        body: { text: null },
        footer: { text: "Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ" },
        nativeFlowMessage: {
          messageParamsJson: JSON.stringify({
            limited_time_offer: {
              text: "Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ",
              url: "https://t.me/xhclintonv",
              copy_code: "xhclintonXD",
              expiration_time: Date.now() * 999
            },
            bottom_sheet: {
              in_thread_buttons_limit: 2,
              divider_indices: [1, 2, 3, 4, 5, 999],
              list_title: "select here",
              button_title: "xhclinton"
            },
            tap_target_configuration: {
              title: " X ",
              description: "bomboclard",
              canonical_url: "https://t.me/xhclintonv",
              domain: "xhclinton.com",
              button_index: 0
            }
          }),
          buttons: [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "list selection",
                sections: [
                  {
                    title: "𝙏𝙊𝙓𝙄𝘾 𝙈𝘿 𝙈𝙀𝙉𝙐",
                    highlight_label: "Toxic",
                    rows: [
                      { title: "𝐅𝐮𝐥𝐥𝐌𝐞𝐧𝐮", description: ".fullmenu", id: `${effectivePrefix}fullmenu` },
                      { title: "𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫", description: ".dev", id: `${effectivePrefix}dev` },
                      { title: "𝐏𝐢𝐧𝐠", description: ".ping", id: `${effectivePrefix}ping` },
                      { title: "𝐑𝐞𝐩𝐨", description: ".repo", id: `${effectivePrefix}repo` },
                    ]
                  }
                ]
              })
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "𝐎𝐏𝐄𝐍 𝐑𝐄𝐏𝐎",
                url: "https://github.com/xhclintohn/Toxic-MD",
              })
            },
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: "📋 Copy Code",
                copy_code: 'ToxicMD',
              })
            },
          ],
          messageParamsJson: JSON.stringify({
            bottom_sheet: {
              in_thread_buttons_limit: 1,
              divider_indices: [1, 2, 3],
              list_title: "List Button",
              button_title: "𝐎𝐏𝐄𝐍 𝐌𝐄𝐍𝐔"
            }
          })
        }
      }
    }, { userJid: m.sender });

    // === AUDIO ===
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
      await sock.sendMessage(m.chat, {
        audio: { url: audioPath },
        ptt: true,
        mimetype: 'audio/mpeg',
        fileName: 'menu.mp3',
      }, { quoted: m });
    }
  },
};