
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware'); 

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, Owner } = context;

})

}