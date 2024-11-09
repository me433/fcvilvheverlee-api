
const Database = require('better-sqlite3')

const verifyUser = (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    // Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => {
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })

    const foundUser = db.prepare(`SELECT user_id FROM refresh_tokens WHERE token = ?`).get(refreshToken);
    if (!foundUser) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

    next();
}

const verifyAdmin = (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    // Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => {
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })

    const foundUser = db.prepare(`SELECT user_id FROM refresh_tokens WHERE token = ?`).get(refreshToken);
    if (!foundUser) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

    const adminUser = db.prepare(`SELECT isAdmin FROM users WHERE id = ?`).get(foundUser.user_id);
    if (!adminUser) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

    next();
}

module.exports = { verifyUser, verifyAdmin }