const keys = {
      GROQ_API_KEY: process.env.GROQ_API_KEY || 'REPLACE_WITH_YOUR_GROQ_API_KEY_HERE',
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'https://factual-woodcock-95465.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAXTpAAIncDJiZDVmNTY1NTEwMDU0YzljOWY2ZTA1MTMwMzcwZDBkZnAyOTU0NjU',
  };

  module.exports = keys;
  