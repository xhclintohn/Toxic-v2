const fetch = require('node-fetch');
const axios = require('axios');

module.exports = {
  name: 'fetch',
  aliases: ['get', 'url', 'web'],
  description: 'Fetches and displays information from a URL',
  run: async (context) => {
    const { client, m, prefix, botname } = context;

    /**
     * Extract URL from message
     */
    const url = m.body.replace(new RegExp(`^${prefix}(fetch|get|url|web)\\s*`, 'i'), '').trim();
    
    if (!url) {
      return client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the URL!\n│❒ Example: ${prefix}fetch https://example.com\n│❒ Or: ${prefix}get https://api.github.com/users/octocat\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    // Basic URL validation
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = 'https://' + url;
    }

    try {
      /**
       * Send loading message
       */
      const loadingMsg = await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Fetching data from URL... 🔍\n│❒ ${targetUrl}\n│❒ Please wait... ⏳\n┗━━━━━━━━━━━━━━━┛`
      }, { quoted: m });

      /**
       * Fetch data from URL
       */
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      /**
       * Handle different content types
       */
      if (contentType.includes('application/json')) {
        // JSON response
        const data = await response.json();
        
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
        
        // Format JSON nicely
        const jsonString = JSON.stringify(data, null, 2);
        
        // If JSON is too long, send as file
        if (jsonString.length > 1500) {
          await client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *JSON Response* 📄\n│❒ URL: ${targetUrl}\n│❒ Status: ${response.status}\n│❒ Size: ${jsonString.length} characters\n│❒ *Sending as file...*\n┗━━━━━━━━━━━━━━━┛`
          }, { quoted: m });
          
          // Send as file
          await client.sendMessage(m.chat, {
            document: Buffer.from(jsonString),
            mimetype: 'application/json',
            fileName: `fetch_result_${Date.now()}.json`
          }, { quoted: m });
        } else {
          // Send as message
          await client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *JSON Response* 📄\n│❒ URL: ${targetUrl}\n│❒ Status: ${response.status}\n│❒ Size: ${jsonString.length} characters\n│❒ \`\`\`json\n${jsonString}\n\`\`\`\n┗━━━━━━━━━━━━━━━┛`
          }, { quoted: m });
        }

      } else if (contentType.includes('text/html')) {
        // HTML response
        const html = await response.text();
        
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
        
        // Extract title from HTML
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'No title found';
        
        // Get page info
        const contentPreview = html.replace(/<[^>]*>/g, '').substring(0, 200).trim();
        
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Web Page Fetched* 🌐\n│❒ URL: ${targetUrl}\n│❒ Status: ${response.status}\n│❒ Title: ${title}\n│❒ Size: ${html.length} characters\n│❒ \n│❒ *Preview:*\n│❒ ${contentPreview}...\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });

      } else if (contentType.includes('text/plain')) {
        // Plain text response
        const text = await response.text();
        
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
        
        if (text.length > 1500) {
          await client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Text Response* 📝\n│❒ URL: ${targetUrl}\n│❒ Status: ${response.status}\n│❒ Size: ${text.length} characters\n│❒ *Sending as file...*\n┗━━━━━━━━━━━━━━━┛`
          }, { quoted: m });
          
          await client.sendMessage(m.chat, {
            document: Buffer.from(text),
            mimetype: 'text/plain',
            fileName: `fetch_result_${Date.now()}.txt`
          }, { quoted: m });
        } else {
          await client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Text Response* 📝\n│❒ URL: ${targetUrl}\n│❒ Status: ${response.status}\n│❒ Size: ${text.length} characters\n│❒ \n│❒ ${text}\n┗━━━━━━━━━━━━━━━┛`
          }, { quoted: m });
        }

      } else if (contentType.includes('image/')) {
        // Image response
        const imageBuffer = await response.buffer();
        
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
        
        await client.sendMessage(m.chat, {
          image: imageBuffer,
          caption: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Image Fetched* 🖼️\n│❒ URL: ${targetUrl}\n│❒ Status: ${response.status}\n│❒ Type: ${contentType}\n│❒ Size: ${(imageBuffer.length / 1024).toFixed(2)} KB\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });

      } else {
        // Other content types
        const data = await response.text();
        
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
        
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *URL Fetched* 🔗\n│❒ URL: ${targetUrl}\n│❒ Status: ${response.status}\n│❒ Content-Type: ${contentType}\n│❒ Size: ${data.length} characters\n│❒ \n│❒ *Raw Response (first 500 chars):*\n│❒ ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });
      }

    } catch (error) {
      console.error('Fetch command error:', error);
      
      // Try to delete loading message
      try {
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
      } catch (e) {
        // Ignore delete errors
      }

      let errorMessage = error.message;
      if (error.name === 'TimeoutError') {
        errorMessage = 'Request timed out after 30 seconds';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Could not resolve the URL. Check if the domain exists.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The server may be down.';
      }

      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Fetch Failed! 😤\n│❒ URL: ${targetUrl}\n│❒ Error: ${errorMessage}\n┗━━━━━━━━━━━━━━━┛`
      }, { quoted: m });
    }
  }
};