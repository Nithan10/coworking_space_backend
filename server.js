require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

// Import Routes
const enquiryRoutes = require('./routes/enquiryRoutes'); 
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require("./routes/locationRoutes");
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); 
const requestRoutes = require('./routes/requestRoutes'); 

const app = express();

// ==========================================
// CRITICAL FIX FOR RENDER / DEPLOYMENT
// ==========================================
// Tells Express to trust the load balancer/proxy. 
// This is absolutely REQUIRED for secure cookies and Google OAuth redirects to work correctly via HTTPS.
app.set('trust proxy', 1);

// ==========================================
// 1. STANDARD MIDDLEWARE
// ==========================================
// Enable CORS for frontend communication
app.use(cors({
  origin: [
    'https://coworking-space-one.vercel.app', 
    'http://localhost:3000',                  
    'https://your-production-url.com'
  ],
  credentials: true
}));

// Parse incoming JSON payloads
app.use(express.json());
// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. AUTHENTICATION & SESSION MIDDLEWARE
// ==========================================
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_keep_it_safe',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    // Secure must be true in production to send cookies over HTTPS
    secure: process.env.NODE_ENV === 'production',
    // 'none' is required for cross-site cookies since your Vercel frontend and Render backend are on different domains
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ==========================================
// Load Passport Configuration Strategy
// FIXED: Removed the try/catch block so errors aren't hidden!
// ==========================================
require('./config/passport')(passport);

// ==========================================
// 3. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected to SpaceHub DB!'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// ==========================================
// 4. API ROUTES
// ==========================================
// Health Check Route
app.get('/', (req, res) => {
  res.json({ message: '🚀 SpaceHub API is running smoothly!' });
});

// Mount specific feature routes
app.use('/api/enquiries', enquiryRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/locations", locationRoutes);
app.use('/api/bookings', bookingRoutes); 
app.use('/api/payment', paymentRoutes);
app.use('/api/requests', requestRoutes); 

// ==========================================
// 5. ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// 6. SERVER STARTUP
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});