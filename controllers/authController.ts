const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const { db } = require('../model/db.ts');
require('dotenv').config();


const handleLogin = async (req, res) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader)
    if (!authHeader) {
        return res.status(401).send('Authorization header missing');
    }
    if (!authHeader.startsWith('Basic ')) {
        return res.status(401).send('Invalid authentication format');
    }

    const base64Credentials = authHeader.slice(6); // Remove "Basic " prefix
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    const query = await db.collection('users').where("username", "==", username).get();
    const foundUser = query.docs[0]
    if (foundUser.empty) return res.status(401).send({message: 'Invalid credentials'}); //Unauthorized
    else if (!foundUser.data().active) return res.status(403).send({message: 'Inactive user'}); //Forbidden (Inactive)

    // evaluate password 
    const match = await bcrypt.compare(password, foundUser?.data()?.password);
    if (match) {
        // create JWTs
        const roles = foundUser?.data()?.isAdmin? ["admin", "user"] : ["user"];

        const accessToken = jwt.sign(
            { 
                "username": foundUser.data().username,
                "admin": foundUser.data().isAdmin
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30s' }
        );
        const refreshToken = jwt.sign(
            { 
                "username": foundUser.data().username,
                "admin": foundUser.data().isAdmin,
                "sub": foundUser.id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('jwt', refreshToken, {httpOnly: true, sameSite: 'None', secure: true, maxAge: 24*60*60*1000});
        res.json({ accessToken, roles })

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