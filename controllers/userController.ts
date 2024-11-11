const bcrypt = require('bcrypt');
const { db } = require('../model/db.ts');
require('dotenv').config()



const getUsers = async (req, res) => {
    const userCollection = db.collection('users');
    const userList = await userCollection.get();
    const listToSend = [];
    userList.forEach(doc => {
        listToSend.push({
            id: doc.id,
            firstName: doc.data().firstName,
            lastName: doc.data().lastName,
            email: doc.data().email,
            username: doc.data().username,
            active: doc.data().active,
            isAdmin: doc.data().isAdmin
        })
    });
    res.send( listToSend )
}

// const getUsers = async (req, res) => {
//     // Connect to DB
//     const db = new Database('./model/users.db', {readonly: false}, (err) => {
//         if (err) return console.error(err.message);
//         else console.log('Connected to SQLite db')
//     })

//     const userList = db.prepare(`SELECT id, firstName, lastName, email, username, active, isAdmin FROM users`).all();
//     res.send( userList )
// }

const handleCreateUser = async (req, res) => {
    const { username: user, password: pwd, email, firstName: first_name, lastName: last_name } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

    try {
        // check for duplicate usernames in the db
        const duplicateSnapshot = await db.collection('users').where('username', '==', user).get();

        if (!duplicateSnapshot.empty) {
            return res.sendStatus(409); //Conflict 
        }

        //encrypt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);

        //create and store the new user
        const newUser = db.collection('users');
        const docRef = await newUser.add({
            username: user,
            password: hashedPwd,
            email: email,
            firstName: first_name,
            lastName: last_name,
            active: 1,
            isAdmin: 0
        })
        res.send({ id: docRef.id, username: user, email: email, active: 1, isAdmin: 0, firstName: first_name, lastName: last_name});
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

// const handleCreateUser = async (req, res) => {
//     const { username: user, password: pwd, email, firstName: first_name, lastName: last_name } = req.body;
//     if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

//     //Connect to DB
//     const db = new Database('./model/users.db', {readonly: false}, (err) => {
//         if (err) return console.error(err.message);
//         else console.log('Connected to SQLite db')
//     })

//     // check for duplicate usernames in the db
//     const duplicate = db.prepare(`SELECT username FROM users WHERE username = ?`).get(user)?.username;

//     const newUser = db.prepare(`INSERT INTO users (id, username, password, email, firstName, lastName, active) VALUES (?, ?, ?, ?, ?, ?, ?);`);

//     if (duplicate) {
//         db.close();
//         return res.sendStatus(409); //Conflict 
//     }

//     try {
//         //encrypt the password
//         const hashedPwd = await bcrypt.hash(pwd, 10);

//         //create and store the new user
//         const id = uuidv4()
//         newUser.run(id, user, hashedPwd, email, first_name, last_name, 1)
//         db.close();

//         res.send({ id: id, username: user, email: email, active: 1, isAdmin: 0, firstName: first_name, lastName: last_name});
//     } catch (err) {
//         db.close();
//         res.status(500).json({ 'message': err.message });
//     }
// }

const handleToggleAdmin = async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 'message': 'Id is required.' });

    // check if user exists
    const exists = await db.collection('users').doc(id).get(); 

    if (exists.empty) {
        return res.sendStatus(409); //Conflict 
    }

    let totalAdmins = 0;
    const userCollection = db.collection('users');
    const userList = await userCollection.get();
    userList.forEach(doc => totalAdmins += doc.data().isAdmin);

    if (totalAdmins < 2 && exists.data().isAdmin == 1) {
        return res.status(400).json({ 'message': 'At least one admin required.'})
    }

    try {
        const updateUser = await userCollection.doc(id).update({
            isAdmin: 1-exists.data().isAdmin
        })

        if (exists.data().isAdmin) {
            res.status(201).json({ 'success': `User with id ${id} is no longer an admin!` });
        }
        else {
            res.status(201).json({ 'success': `User with id ${id} is now an admin!` });
        }
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

// const handleToggleAdmin = async (req, res) => {
//     const { id } = req.body;
//     if (!id) return res.status(400).json({ 'message': 'Id is required.' });

//     //Connect to DB
//     const db = new Database('./model/users.db', {readonly: false}, (err) => {
//         if (err) return console.error(err.message);
//         else console.log('Connected to SQLite db')
//     })
//     const adminUser = db.prepare(`UPDATE users SET isAdmin = ? WHERE id = ?;`);

//     // check if user exists
//     const exists = db.prepare(`SELECT username, isAdmin FROM users WHERE id = ?`).get(id); 

//     if (!exists?.username) {
//         db.close();
//         return res.sendStatus(409); //Conflict 
//     }

//     const enoughAdmins = db.prepare('SELECT SUM(isAdmin) as total FROM users').get();
//     console.log(enoughAdmins.total)

//     if (enoughAdmins.total < 2 && exists.isAdmin == 1) {
//         db.close();
//         return res.status(400).json({ 'message': 'At least one admin required.'})
//     }

//     try {
//         //encrypt the password

//         //create and store the new user
//         adminUser.run(1-exists.isAdmin, id)
//         db.close();

//         if (exists.isAdmin) {
//             res.status(201).json({ 'success': `User with id ${id} is no longer an admin!` });
//         }
//         else {
//             res.status(201).json({ 'success': `User with id ${id} is now an admin!` });
//         }
//     } catch (err) {
//         db.close();
//         res.status(500).json({ 'message': err.message });
//     }
// }

const handleDeleteUser = async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 'message': 'Id is required.' });

    const adminUser = await db.collection('users').doc(id).get();
    if (adminUser.data().isAdmin) {
        return res.status(400).json({ 'message': 'Cannot delete admin users.' })
    }

    try {
        const deleteUser = await db.collection('users').doc(id).delete();

        res.status(200).json({ 'success': `User with id ${id} was deleted!` });
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

// const handleDeleteUser = async (req, res) => {
//     const { id } = req.body;
//     if (!id) return res.status(400).json({ 'message': 'Id is required.' });

//     //Connect to DB
//     const db = new Database('./model/users.db', {readonly: false}, (err) => {
//         if (err) return console.error(err.message);
//         else console.log('Connected to SQLite db')
//     })

//     const adminUser = db.prepare('SELECT isAdmin FROM users WHERE id = ?;').get(id);

//     if (adminUser.isAdmin) {
//         return res.status(400).json({ 'message': 'Cannot delete admin users.' })
//     }

//     const deleteUser = db.prepare(`DELETE FROM users WHERE id = ?;`);

//     try {
//         //delete user
//         deleteUser.run(id)
//         db.close();

//         res.status(200).json({ 'success': `User with id ${id} was deleted!` });
//     } catch (err) {
//         db.close();
//         res.status(500).json({ 'message': err.message });
//     }
// }

const handleToggleActive = async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 'message': 'Id is required.' });

    // check if user exists
    const exists = await db.collection('users').doc(id).get(); 
    if (exists.empty) {
        return res.sendStatus(409); //Conflict 
    }

    try {
        const updateUser = await db.collection('users').doc(id).update({
            active: 1-exists.data().active
        })

        if (exists.data().active) {
            res.status(201).json({ 'success': `User with id ${id} is no longer active!` });
        }
        else {
            res.status(201).json({ 'success': `User with id ${id} is now active!` });
        }
    } catch (err) {
        db.close();
        res.status(500).json({ 'message': err.message });
    }
}


// const handleToggleActive = async (req, res) => {
//     const { id } = req.body;
//     if (!id) return res.status(400).json({ 'message': 'Id is required.' });

//     //Connect to DB
//     const db = new Database('./model/users.db', {readonly: false}, (err) => {
//         if (err) return console.error(err.message);
//         else console.log('Connected to SQLite db')
//     })
//     const activate = db.prepare(`UPDATE users SET active = ? WHERE id = ?;`);

//     // check if user exists
//     const exists = db.prepare(`SELECT username, active FROM users WHERE id = ?`).get(id); 

//     if (!exists?.username) {
//         db.close();
//         return res.sendStatus(409); //Conflict 
//     }

//     try {
//         //encrypt the password

//         //create and store the new user
//         activate.run(1-exists.active, id)
//         db.close();


//         if (exists.active) {
//             res.status(201).json({ 'success': `User with id ${id} is no longer active!` });
//         }
//         else {
//             res.status(201).json({ 'success': `User with id ${id} is now active!` });
//         }
//     } catch (err) {
//         db.close();
//         res.status(500).json({ 'message': err.message });
//     }
// }

module.exports = { handleCreateUser, handleDeleteUser, handleToggleAdmin, handleToggleActive, getUsers };