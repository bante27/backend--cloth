const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/Users'); // 💡 Ensure this is 'User', not 'Users' if your file is User.js

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // 💡 This MUST match the Google Console exactly (including http vs https)
    callbackURL: "http://localhost:5000/api/users/auth/google/callback" 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
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
    callbackURL: "http://localhost:5000/api/users/auth/facebook/callback",
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
  const user = await User.findById(id);
  done(null, user);
});