const { getFakeQuoted } = require('../../lib/fakeQuoted');
module.exports = async (context) => {
    const { m } = context;
    const fq = getFakeQuoted(m);

    const Obf = require("javascript-obfuscator");

    
    if (m.quoted && m.quoted.text) {
        const forq = m.quoted.text;

       
        const obfuscationResult = Obf.obfuscate(forq, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1
        });

        console.log("Successfully encrypted the code");
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ENCRYPTED ≪───\n├ \n├ ${obfuscationResult.getObfuscatedCode()}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    } else {
        m.reply('╭───(    TOXIC-MD    )───\n├───≫ ENCRYPT ≪───\n├ \n├ Tag a valid JavaScript code to encrypt!\n├ Stop wasting my time.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }
};