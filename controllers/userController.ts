const bcrypt = require('bcrypt');
const Database = require('better-sqlite3')
const { v4: uuidv4 } = require('uuid');


const getUsers = async (req, res) => {
    // Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => {
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })

    const userList = db.prepare(`SELECT id, firstName, lastName, username, active, isAdmin FROM users`).all();
    res.send( userList )
}

const handleCreateUser = async (req, res) => {
    const { user, pwd, email, first_name, last_name } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

    //Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => {
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })
    const newUser = db.prepare(`INSERT INTO users (id, username, password, email, firstName, lastName, active) VALUES (?, ?, ?, ?, ?, ?, ?);`);

    // check for duplicate usernames in the db
    const duplicate = db.prepare(`SELECT username FROM users WHERE username = ?`).get(user)?.username;

    if (duplicate) {
        db.close();
        return res.sendStatus(409); //Conflict 
    }

    try {
        //encrypt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);

        //create and store the new user
        newUser.run(uuidv4(), user, hashedPwd, email, first_name, last_name, 1)
        db.close();


        res.status(201).json({ 'success': `New user ${user} created!` });
    } catch (err) {
        db.close();
        res.status(500).json({ 'message': err.message });
    }
}

const handleMakeAdmin = async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 'message': 'Id is required.' });

    //Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => {
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })
    const adminUser = db.prepare(`UPDATE users SET isAdmin = 1 WHERE id = ?;`);

    // check if user is active
    const isActive = db.prepare(`SELECT username FROM users WHERE id = ?`).get(id); 

    if (!isActive) {
        db.close();
        return res.sendStatus(409); //Conflict 
    }

    try {
        //encrypt the password

        //create and store the new user
        adminUser.run(id)
        db.close();


        res.status(201).json({ 'success': `User with id ${id} is now an admin!` });
    } catch (err) {
        db.close();
        res.status(500).json({ 'message': err.message });
    }
}

const handleDeleteUser = async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 'message': 'Id is required.' });

    //Connect to DB
    const db = new Database('./model/users.db', {readonly: false}, (err) => {
        if (err) return console.error(err.message);
        else console.log('Connected to SQLite db')
    })
    const deleteUser = db.prepare(`DELETE FROM users WHERE id = ?;`);

    try {
        //delete user
        deleteUser.run(id)
        db.close();


        res.status(200).json({ 'success': `User with id ${id} was deleted!` });
    } catch (err) {
        db.close();
        res.status(500).json({ 'message': err.message });
    }
}

module.exports = { handleCreateUser, handleDeleteUser, handleMakeAdmin, getUsers };