const keys = {
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
    GIST_ID: process.env.GIST_ID || '',
};

module.exports = keys;
