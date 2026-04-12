
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware'); 
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, Owner } = context;
        const fq = getFakeQuoted(m);

})

}