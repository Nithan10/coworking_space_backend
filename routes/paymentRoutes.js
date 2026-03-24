const express = require('express');
const router = express.Router();
const {
    initiatePayment,
    paymentCallback,
    getAllBookings,
    updateAdminBookingStatus,
    getUserBookings
} = require('../controllers/paymentController');

// Route: POST /api/payment/initiate
router.post('/initiate', initiatePayment);

// Handle PhonePe redirect back to our server (Accepts GET and POST)
router.post('/callback/:transactionId', paymentCallback);
router.get('/callback/:transactionId', paymentCallback);

// Route: GET /api/payment/bookings (Used by Admin Dashboard to view all bookings)
router.get('/bookings', getAllBookings); 

// Route: PATCH /api/payment/bookings/:id/status (Used by Admin Dashboard to manually change status)
router.patch('/bookings/:id/status', updateAdminBookingStatus);

// Route: GET /api/payment/user-bookings (Used by User Dashboard)
router.get('/user-bookings', getUserBookings); 

module.exports = router;