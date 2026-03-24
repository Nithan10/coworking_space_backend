const express = require('express');
const router = express.Router();
const { 
  createBookingAndInitPayment, 
  paymentCallback, 
  getAllBookings // Added import
} = require('../controllers/bookingController');

// Route called by your React frontend to initiate booking
router.post('/book', createBookingAndInitPayment);

// Route called by PhonePe after payment processing
router.post('/payment/callback/:transactionId', paymentCallback);

// --- ADDED THIS ROUTE FOR YOUR ADMIN PANEL ---
// Note: Matches the fetch call in your frontend: /api/payment/bookings
router.get('/payment/bookings', getAllBookings);

// Depending on how your main server.js mounts this router, 
// if it mounts via app.use('/api', bookingRoutes), the route above works perfectly.
// If it mounts via app.use('/api/payment', bookingRoutes), change the above to router.get('/bookings', getAllBookings);

module.exports = router;