const express = require('express');
const router = express.Router();
const { createEnquiry, getAllEnquiries, testApi } = require('../controllers/enquiryController');

// Import authentication middleware for the admin route
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');

router.get('/test', testApi); // Go to http://localhost:5000/api/enquiries/test to verify

// Public route to submit an enquiry
router.post('/', createEnquiry);

// Protected Admin route to view all enquiries
router.get('/', verifyToken, isAdmin, getAllEnquiries);

module.exports = router;