const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Adjust the path if your model is elsewhere

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Absolute URLs based on environment to prevent Google Cloud mismatches
        callbackURL: process.env.NODE_ENV === 'production' 
          ? 'https://coworking-space-backend.onrender.com/api/auth/google/callback'
          : 'http://localhost:5000/api/auth/google/callback',
        // CRITICAL FOR RENDER: Tells Passport to trust the HTTPS proxy
        proxy: true 
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Check if a user with this specific Google ID already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists via Google, log them in
            return done(null, user);
          }

          // 2. If not found by Google ID, check if the email already exists 
          // (This happens if they signed up manually via Email/Password previously)
          const email = profile.emails[0].value;
          user = await User.findOne({ email: email });

          if (user) {
            // The email exists! Link the Google ID to their existing account
            user.googleId = profile.id;
            
            // Add avatar if they didn't have one from manual signup
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
              user.avatar = profile.photos[0].value;
            }

            await user.save();
            return done(null, user);
          }

          // 3. If no user and no email match, this is a brand new user. Create them.
          const newUser = {
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
            role: 'user', // Default role for SpaceHub
          };

          user = await User.create(newUser);
          return done(null, user);

        } catch (error) {
          console.error('Error in Google Strategy:', error);
          return done(error, null);
        }
      }
    )
  );

  // --- Serialization ---
  // Required by Passport's internal mechanics during the OAuth flow, 
  // even when using JWTs for the final session management.
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};