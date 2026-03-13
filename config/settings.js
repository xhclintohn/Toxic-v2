const session = process.env.SESSION || '';
const mycode = process.env.CODE || "254";
const botname = process.env.BOTNAME || 'Toxic-MD';
const herokuAppName = process.env.HEROKU_APP_NAME || '';
const database = process.env.DATABASE_URL || '';

function getHerokuApiKey() {
    return process.env.HEROKU_API_KEY || '';
}

module.exports = {
    session,
    mycode,
    botname,
    database,
    herokuAppName,
    getHerokuApiKey
};
