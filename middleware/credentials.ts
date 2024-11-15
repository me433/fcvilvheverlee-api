const allowedOrigins = require('../config/allowedOrigins.ts');

const credentials = (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', "*");
        res.header('Access-Control-Allow-Headers', "['Content-Type', 'Authorization']");
        res.header('Access-Control-Allow-Methods', "*");
        res.header('Access-Control-Allow-Credentials', true);
    }
    next();
}

module.exports = credentials