const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Adjust the path if your model is elsewhere

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Check if a user with this specific Google ID already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists via Google, log them in
            return done(null, user);
          }

          // 2. If not found by Google ID, check if the email already exists in the database
          // (This happens if they signed up via the Email/Password form previously)
          const email = profile.emails[0].value;
          user = await User.findOne({ email: email });

          if (user) {
            // The email exists! Link the Google ID to their existing account
            user.googleId = profile.id;
            
            // If they didn't have an avatar from manual signup, you can add it here
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
            // Note: We don't set a password here because they use Google to log in
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
  // Even though we are using JWTs (session: false in our routes), 
  // Passport sometimes requires these to be defined to prevent internal errors 
  // during the initial OAuth redirect phase.
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