const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken'); // Moved to the top!

const { register, login } = require('../controllers/authController');

// ==========================================
// 1. STANDARD EMAIL/PASSWORD ROUTES
// ==========================================
router.post('/register', register);
router.post('/login', login);

// ==========================================
// 2. GOOGLE OAUTH ROUTES
// ==========================================
// Trigger the Google Login screen
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback Route
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: 'https://coworking-space-one.vercel.app/auth?error=failed' }),
  (req, res) => {
    try {
      // Safety check for JWT_SECRET to prevent the "secretOrPrivateKey" crash
      const secret = process.env.JWT_SECRET || 'fallback_development_secret';
      
      // Generate JWT for the authenticated Google User
      // WE ADDED name, email, and avatar HERE so the frontend can display them!
      const token = jwt.sign(
        { 
          id: req.user._id, 
          role: req.user.role,
          name: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar
        }, 
        secret, 
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      
      // Redirect to frontend, securely passing the token in the URL
      res.redirect(`https://coworking-space-one.vercel.app/auth-success?token=${token}`);
      
    } catch (error) {
      console.error('Error generating Google OAuth token:', error);
      // If something breaks, safely redirect back to the login page
      res.redirect('https://coworking-space-one.vercel.app/auth?error=server_error');
    }
  }
);

module.exports = router;