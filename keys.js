const keys = {
    GROQ_API_KEY: process.env.GROQ_API_KEY || 'REPLACE_WITH_YOUR_GROQ_API_KEY_HERE',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
};

module.exports = keys;
