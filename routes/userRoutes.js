const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');

// Import your existing middleware
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');

// Protect the route: The user must be logged in (verifyToken) AND be an admin (isAdmin)
router.get('/', verifyToken, isAdmin, getAllUsers);

module.exports = router;