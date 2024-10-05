const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.ts');


router.post('/', userController.handleCreateUser)
    .post('/admin', userController.handleMakeAdmin)
    .delete('/', userController.handleDeleteUser);

module.exports = router;