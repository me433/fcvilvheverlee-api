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
    return res.send( listToSend )
}


const handleCreateUser = async (req, res) => {
    const { username: user, password: pwd, email, firstName: first_name, lastName: last_name } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': `${req}: Username and password are required to create a user.` });

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
        return res.send({ id: docRef.id, username: user, email: email, active: 1, isAdmin: 0, firstName: first_name, lastName: last_name});
    } catch (err) {
        return res.status(500).json({ 'message': err.message });
    }
}


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
            return res.status(201).json({ 'success': `User with id ${id} is no longer an admin!` });
        }
        else {
            return res.status(201).json({ 'success': `User with id ${id} is now an admin!` });
        }
    } catch (err) {
        return res.status(500).json({ 'message': err.message });
    }
}



const handleDeleteUser = async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 'message': 'Id is required.' });

    const adminUser = await db.collection('users').doc(id).get();
    if (adminUser.data().isAdmin) {
        return res.status(400).json({ 'message': 'Cannot delete admin users.' })
    }

    try {
        const deleteUser = await db.collection('users').doc(id).delete();

        return res.status(200).json({ 'success': `User with id ${id} was deleted!` });
    } catch (err) {
        return res.status(500).json({ 'message': err.message });
    }
}


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
            return res.status(201).json({ 'success': `User with id ${id} is no longer active!` });
        }
        else {
            return res.status(201).json({ 'success': `User with id ${id} is now active!` });
        }
    } catch (err) {
        db.close();
        return res.status(500).json({ 'message': err.message });
    }
}


module.exports = { handleCreateUser, handleDeleteUser, handleToggleAdmin, handleToggleActive, getUsers };