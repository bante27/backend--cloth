const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/Users'); // 💡 Ensure file path matches your project structure

// Base Backend URL dynamically set based on environment
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://backend-cloth.onrender.com' 
  : 'http://localhost:5000';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // ✅ Dynamically selected URL for Local vs Render
    callbackURL: `${BACKEND_URL}/api/users/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      
      if (!email) {
        return done(new Error("No email found from Google account"), null);
      }

      // Find or create user
      let user = await User.findOne({ email });
      
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email: email,
          password: 'social-login-password-' + Math.random(), 
          isActive: true
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'placeholder',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'placeholder',
    callbackURL: `${BACKEND_URL}/api/users/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
        let user = await User.findOne({ email });
        
        if (!user) {
            user = await User.create({
                name: profile.displayName,
                email: email,
                password: 'social-login-fb-' + Math.random(),
                isActive: true
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
  }
));

// Required for passport to work
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});