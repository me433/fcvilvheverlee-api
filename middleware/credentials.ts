const allowedOrigins = require('../config/allowedOrigins.ts');

const credentials = (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Headers', 'Authorization');
        if (req.method == 'OPTIONS') res.send(200);
    }
    next();
}

module.exports = credentials