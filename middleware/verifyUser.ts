const { db } = require('../model/db.ts');

const verifyUser = async (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    const refreshTokenCollection = db.collection('refresh_tokens');
    const foundUser = await refreshTokenCollection.where('token', '==', refreshToken).get();
    if (foundUser.empty) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

    next();
}

const verifyAdmin = async (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    const refreshTokenCollection = db.collection('refresh_tokens');
    const foundUser = await refreshTokenCollection.where('token', '==', refreshToken).get();
    if (foundUser.empty) return res.status(403).send({message: 'Forbidden'}); //Unauthorized


    const adminUser = await db.collection('users').doc(foundUser.docs[0].data().user_id);
    if (!adminUser?.data()?.isAdmin) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

    next();
}

// const verifyUser = (req, res, next) => {
//     const cookies = req.cookies;
//     if (!cookies?.jwt) return res.sendStatus(401);
//     const refreshToken = cookies.jwt;

//     // Connect to DB
//     const db = new Database('./model/users.db', {readonly: false}, (err) => {
//         if (err) return console.error(err.message);
//         else console.log('Connected to SQLite db')
//     })

//     const foundUser = db.prepare(`SELECT user_id FROM refresh_tokens WHERE token = ?`).get(refreshToken);
//     if (!foundUser) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

//     next();
// }

// const verifyAdmin = (req, res, next) => {
//     const cookies = req.cookies;
//     if (!cookies?.jwt) return res.sendStatus(401);
//     const refreshToken = cookies.jwt;

//     // Connect to DB
//     const db = new Database('./model/users.db', {readonly: false}, (err) => {
//         if (err) return console.error(err.message);
//         else console.log('Connected to SQLite db')
//     })

//     const foundUser = db.prepare(`SELECT user_id FROM refresh_tokens WHERE token = ?`).get(refreshToken);
//     if (!foundUser) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

//     const adminUser = db.prepare(`SELECT isAdmin FROM users WHERE id = ?`).get(foundUser.user_id);
//     if (!adminUser) return res.status(403).send({message: 'Forbidden'}); //Unauthorized

//     next();
// }

module.exports = { verifyUser, verifyAdmin }