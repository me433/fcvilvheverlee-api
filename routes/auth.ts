const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.ts');

router.post('/', authController.handleLogin);
router.delete('/', authController.handleLogout);

module.exports = router;