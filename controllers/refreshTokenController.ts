const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const handleRefreshToken = (req, res) => {
    const cookies = req.cookies;
    console.log(req.cookies)
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    // Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => { //can be true
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })

    const foundUser = db.prepare(`SELECT * FROM refresh_tokens WHERE token = ?`).get(refreshToken);
    if (!foundUser) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

    // evaluate jwt 
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
            const accessToken = jwt.sign(
                { "username": decoded.username },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '30s' }
            );
            res.json({ accessToken })
        }
    );
}

module.exports = { handleRefreshToken }