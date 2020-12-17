const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require("../models/User");
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require("passport-local-mongoose");


var domainURL = "https://poetika.herokuapp.com"
if (process.env.port == null || process.env.port == "") {
    domainURL = "http://localHost:3000"
}

// Passport Local Strategy
passport.use(
    new LocalStrategy(
        function (username, password, done) {
            User.findOne({ username: username }, function (err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect E-mail.' });
                }
                user.authenticate(password, (err, model, passwordError) => {
                    if (passwordError) {
                        return done(null, false, { message: 'Incorrect Password.' });
                    } else {
                        return done(null, user);
                    }
                })
            });
        }
    ));

// Passport Facebook Strategy
passport.use(
    new FacebookStrategy({
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: `${domainURL}/auth/facebook/poetika`
    },
        (accessToken, refreshToken, profile, cb) => {
            User.findOrCreate({ facebookId: profile.id }, (err, user) => {
                if (!user.penName) {
                    user.penName = profile.displayName;
                    user.save();
                }
                return cb(err, user);
            })
        }));

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${domainURL}/auth/google/poetika`,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            if (!user.penName) {
                user.penName = profile.displayName;
                user.save();
            }
            return cb(err, user);
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

module.exports = { passport }