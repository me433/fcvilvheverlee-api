const bcrypt = require('bcrypt');
const Database = require('better-sqlite3')
const jwt = require('jsonwebtoken')
require('dotenv').config()


const handleLogin = async (req, res) => {
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });
    // Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => { //can be true
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })

    const foundUser = db.prepare(`SELECT id, active, isAdmin, password FROM users WHERE username = ?`).get(user);
    if (!foundUser) return res.status(401).send({message: 'Invalid credentials'}); //Unauthorized
    else if (!foundUser.active) return res.status(403).send({message: 'Inactive user'}); //Forbidden (Inactive)

    // evaluate password 
    const match = await bcrypt.compare(pwd, foundUser.password);
    if (match) {
        // create JWTs
        const roles = foundUser?.isAdmin? ["admin", "user"] : ["user"];

        const accessToken = jwt.sign(
            { 
                "username": foundUser.username,
                "admin": foundUser.isAdmin
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30s' }
        );
        const refreshToken = jwt.sign(
            { 
                "username": foundUser.username,
                "admin": foundUser.isAdmin
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        // saving refreshToken
        const saveToken = db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
        saveToken.run(foundUser.id, refreshToken, Date.now()+1000*60*60*24)

        res.cookie('jwt', refreshToken, {httpOnly: true, sameSite: 'None', secure: true, maxAge: 24*60*60*1000});
        res.json({ accessToken, roles })

        //res.json({ 'success': `User ${user} is logged in!` });
    } else {
        res.sendStatus(401);
    }
}

const handleLogout = async (req, res) => {
    // On client, also delete the accessToken
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //No content
    const refreshToken = cookies.jwt;

    // Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => { //can be true
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })

    // Is refreshToken in db?
    const foundUser = db.prepare(`SELECT token FROM refresh_tokens WHERE token = ?`).get(refreshToken);
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }
    console.log(foundUser)
    // Delete refreshToken in db
    const deleteToken = db.prepare('DELETE FROM refresh_tokens WHERE token = ?');
    deleteToken.run(foundUser.token)

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    res.sendStatus(204);
}

module.exports = { handleLogin, handleLogout };