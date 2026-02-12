module.exports = async (context) => {

const { client, m, text } = context;

if (!text) return m.reply("╭───(    TOXIC-MD    )───\n├ Provide a GitHub username to stalk, you lazy bum.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

try {

const response = await fetch(`https://itzpire.com/stalk/github-user?username=${text}`)

const data = await response.json()
 
    const username = data.data.username;
    const nickname = data.data.nickname;
    const bio = data.data.bio;
    const profilePic = data.data.profile_pic;
    const url = data.data.url;
    const type = data.data.type;
    const isAdmin = data.data.admin;
    const company = data.data.company;
    const blog = data.data.blog;
    const location = data.data.location;
    const publicRepos = data.data.public_repo;
    const publicGists = data.data.public_gists;
    const followers = data.data.followers;
    const following = data.data.following;
    const createdAt = data.data.ceated_at;
    const updatedAt = data.data.updated_at;

    
const message = `╭───(    TOXIC-MD    )───\n├───≫ GITHUB STALK ≪───\n├ \n├ Username: ${username}\n├ Nickname: ${nickname}\n├ Bio: ${bio}\n├ Link: ${url}\n├ Location: ${location}\n├ Followers: ${followers}\n├ Following: ${following}\n├ Repos: ${publicRepos}\n├ Created: ${createdAt}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`

await client.sendMessage(m.chat, { image: { url: profilePic}, caption: message}, {quoted: m})

} catch (error) {

m.reply(`╭───(    TOXIC-MD    )───\n├───≫ GITHUB ERROR ≪───\n├ \n├ Unable to fetch data. ${error}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`)

}

} 
