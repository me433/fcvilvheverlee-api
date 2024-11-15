const jwt = require('jsonwebtoken');
const { db } = require('../model/db.ts');
require('dotenv').config();

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) =>  {
            if (err) return res.sendStatus(403);
            const userRoles = await db.collection('users').doc(decoded.sub).get();
            const roles = userRoles?.data()?.isAdmin? ["admin", "user"] : ["user"];
            const accessToken = jwt.sign(
                { 
                    "username": decoded.username,
                    "authorities": roles,
                    "sub": decoded.sub
                 },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );
            return res.json({ roles, accessToken })
        }
    );
}


module.exports = { handleRefreshToken }