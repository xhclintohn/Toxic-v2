import axios from "axios";
import config from "../config.cjs";

// Utility to retry API calls
const retry = async (fn, retries = 2, delay = 2000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries) throw error; // Throw error on last retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Audio download function
const downloadAudio = async (url, m, Matrix) => {
  try {
    await Matrix.sendMessage(m.from, {
      text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* fetchin’ your audio 🎶... Hold tight, fam!
◈━━━━━━━━━━━━━━━━◈`,
    }, { quoted: m });

    const apiEndpoint = `https://api.giftedtech.web.id/api/download/ytaudio?apikey=gifted&format=128kbps&url=${encodeURIComponent(url)}`;
    let response;
    try {
      response = await retry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
        const res = await axios.get(apiEndpoint, { signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
      });
    } catch (apiError) {
      console.error(`[ERROR] Audio API error: ${apiError.message}`);
      if (apiError.response?.status === 500) {
        return Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* hit an API error (500). Server’s down, fam! Try again later! 😓
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
      }
      if (apiError.code === 'ECONNABORTED') {
        return Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* timed out fetching audio. Server too slow! ⏳😡
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
      }
      return Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* couldn’t hit the audio API. Server’s actin’ up! 😡
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }

    if (!response.data?.success || !response.data?.result) {
      console.error(`[ERROR] Invalid audio API response: ${JSON.stringify(response.data)}`);
      return Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* got junk data from audio API. API’s trash! 😤
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }

    const { title, download_url } = response.data.result;
    if (!title || !download_url) {
      console.error(`[ERROR] Missing title or download_url in audio response: ${JSON.stringify(response.data.result)}`);
      return Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* can’t fetch audio "${title || "this file"}". No link, fam! 😣
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }

    try {
      await Matrix.sendMessage(
        m.from,
        {
          audio: { url: download_url },
          mimetype: "audio/mp3",
          ptt: false,
        },
        { quoted: m }
      );
    } catch (sendError) {
      console.error(`[ERROR] Failed to send audio: ${sendError.message}`);
      return Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* can’t send audio "${title}". Failed to deliver, fam! 😣
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }

    await Matrix.sendMessage(m.from, {
      text: `◈━━━━━━━━━━━━━━━━◈
│❒ *${title}* dropped by *Toxic-MD*! Blast it 🎶, fam!
◈━━━━━━━━━━━━━━━━◈`,
    }, { quoted: m });
  } catch (error) {
    console.error(`[ERROR] Audio download error: ${error.message}`);
    await Matrix.sendMessage(m.from, {
      text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* hit a snag while fetching audio, fam! Try again! 😈
◈━━━━━━━━━━━━━━━━◈`,
    }, { quoted: m });
  }
};

// Video download function
const downloadVideo = async (url, m, Matrix) => {
  try {
    await Matrix.sendMessage(m.from, {
      text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* fetchin’ your video 📹... Hold tight, fam!
◈━━━━━━━━━━━━━━━━◈`,
    }, { quoted: m });

    const apiEndpoint = `https://api.giftedtech.web.id/api/download/ytvid?apikey=gifted&format=360p&url=${encodeURIComponent(url)}`;
    let response;
    try {
      response = await retry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
        const res = await axios.get(apiEndpoint, { signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
      });
    } catch (apiError) {
      console.error(`[ERROR] Video API error: ${apiError.message}`);
      if (apiError.response?.status === 500) {
        return Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* hit an API error (500). Server’s down, fam! Try again later! 😓
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
      }
      if (apiError.code === 'ECONNABORTED') {
        return Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* timed out fetching video. Server too slow! ⏳😡
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
      }
      return Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* couldn’t hit the video API. Server’s actin’ up! 😡
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }

    if (!response.data?.success || !response.data?.result) {
      console.error(`[ERROR] Invalid video API response: ${JSON.stringify(response.data)}`);
      return Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* got junk data from video API. API’s trash! 😤
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }

    const { title, download_url } = response.data.result;
    if (!title || !download_url) {
      console.error(`[ERROR] Missing title or download_url in video response: ${JSON.stringify(response.data.result)}`);
      return Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* can’t fetch video "${title || "this file"}". No link, fam! 😣
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }

    try {
      await Matrix.sendMessage(
        m.from,
        {
          video: { url: download_url },
          mimetype: "video/mp4",
          ptt: false,
        },
        { quoted: m }
      );
    } catch (sendError) {
      console.error(`[ERROR] Failed to send video: ${sendError.message}`);
      return Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* can’t send video "${title}". Failed to deliver, fam! 😣
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }

    await Matrix.sendMessage(m.from, {
      text: `◈━━━━━━━━━━━━━━━━◈
│❒ *${title}* dropped by *Toxic-MD*! Watch it 📹, fam!
◈━━━━━━━━━━━━━━━━◈`,
    }, { quoted: m });
  } catch (error) {
    console.error(`[ERROR] Video download error: ${error.message}`);
    await Matrix.sendMessage(m.from, {
      text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* hit a snag while fetching video, fam! Try again! 😈
◈━━━━━━━━━━━━━━━━◈`,
    }, { quoted: m });
  }
};

// Main ytdl function
const ytdl = async (m, Matrix) => {
  try {
    const prefix = config.Prefix || config.PREFIX || ".";
    const cmd = m.body?.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
    const args = m.body.slice(prefix.length + cmd.length).trim().split(" ");

    // Handle command trigger
    if (cmd === "ytdl" || cmd === "video" || cmd === "youtube") {
      if (args.length === 0 || !args.join(" ")) {
        await Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ Yo, give me a YouTube URL to download, fam! 😎
│❒ Example: *${prefix}${cmd}* https://youtu.be/60ItHLz5WEA
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
        return;
      }

      const url = args[0];
      if (!url.includes("youtu.be") && !url.includes("youtube.com")) {
        await Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ That doesn’t look like a valid YouTube URL, fam! Try again. 😤
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
        return;
      }

      const encodedUrl = encodeURIComponent(url);
      const messageOptions = {
        viewOnce: true,
        buttons: [
          {
            buttonId: `ytdl_audio_${encodedUrl}`,
            buttonText: { displayText: "🎧 Audio" },
            type: 1,
          },
          {
            buttonId: `ytdl_video_${encodedUrl}`,
            buttonText: { displayText: "📹 Video" },
            type: 1,
          },
        ],
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
        },
      };

      await Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* got your YouTube link! Pick your vibe, fam! 🎥🎶
│
│ Tap a button to download directly!
◈━━━━━━━━━━━━━━━━◈`,
        ...messageOptions,
      }, { quoted: m });
      return;
    }

    // Handle button clicks
    if (m.message?.buttonsResponseMessage?.selectedButtonId?.startsWith("ytdl_")) {
      const buttonId = m.message.buttonsResponseMessage.selectedButtonId;
      const [action, encodedUrl] = buttonId.split("_", 2);
      const url = decodeURIComponent(encodedUrl);

      if (action === "ytdl_audio") {
        await downloadAudio(url, m, Matrix);
      } else if (action === "ytdl_video") {
        await downloadVideo(url, m, Matrix);
      }
    }
  } catch (error) {
    console.error(`[ERROR] YTDL error: ${error.message}`);
    await Matrix.sendMessage(m.from, {
      text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Toxic-MD* hit a snag, fam! Try again or use a different link! 😈
◈━━━━━━━━━━━━━━━━◈`,
    }, { quoted: m });
  }
};

export default ytdl;