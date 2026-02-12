module.exports = async (context) => {
    const { m } = context;

const {c, cpp, node, python, java} = require('compile-run');

    if (m.quoted && m.quoted.text) {
        const code = m.quoted.text;

async function runCode() {
  try {
    let result = await python.runSource(code);
    console.log(result);
    m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PYTHON OUTPUT ≪───\n├ \n├ ${result.stdout || 'No output'}\n${result.stderr ? '├ stderr: ' + result.stderr + '\n' : ''}╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  } catch (err) {
    console.log(err);
    m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PYTHON ERROR ≪───\n├ \n├ ${err.stderr || err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
}

runCode();

} else { 

m.reply('╭───(    TOXIC-MD    )───\n├───≫ PYTHON COMPILER ≪───\n├ \n├ Quote a valid and short Python code\n├ to compile, you absolute walnut.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧')

}

}
