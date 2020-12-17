//jshint esverison:8

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const alert = require("alert");
const SMTPConnection = require("nodemailer/lib/smtp-connection");
const { doesNotMatch } = require("assert");
const flash = require("connect-flash");
const findOrCreate = require('mongoose-findorcreate');
const {getRoutes} = require('./src/routes');
const { User } = require("./src/models/User");
const { Poem } = require("./src/models/Poem");

const app = express();

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
}))

app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.message = req.flash('message');
    next();
})

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://mar-admin:" + process.env.MONGO_ADMIN_PASSWORD + "@cluster0.0saax.mongodb.net/poetikaDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

var domainURL = "https://poetika.herokuapp.com"

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
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
            console.log(profile);
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
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        console.log(user);
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

var isAuthenticated = false;

app.use("/", getRoutes())

app.get("/", (req, res) => {
    var currentUser = ""
    isAuthenticated = req.isAuthenticated();
    console.log("Is Authenticated: " + isAuthenticated);
    if (isAuthenticated) {
        currentUser = req.user;
    }

    Poem.find((err, foundPoems) => {
        if (err) {
            console.log("An Error Occurred While finding Poems: " + err);
        } else {
            res.render("home", {
                isAuthenticated: isAuthenticated,
                poemArr: foundPoems,
                currentUser: currentUser
            });
        }
    });
});

// ABOUT

app.get("/about", (req, res) => {
    res.render("about", {
        isAuthenticated: isAuthenticated
    });
});

// ACCOUNT 

// app.get("/account/profile", (req, res) => {
//     if (isAuthenticated) {
//         res.render("account", {
//             isAuthenticated: isAuthenticated,
//             currentUser: req.user
//         });
//     } else {
//         res.redirect("/auth/login");
//     }
// });

app.post("/account/change_pen_name", (req, res) => {
    if (isAuthenticated) {
        const currentUserId = req.user.id;
        const newPenName = req.body.newPenName;
        User.findOne({ _id: currentUserId }, (err, foundUser) => {
            if (foundUser) {
                console.log(foundUser);
                // console.log("currentPenName: " + foundUser.penName);
                // console.log("newPenName: " + newPenName);
                foundUser.penName = newPenName;

                foundUser.save()
                console.log(foundUser);
                // console.log("currentUserId: " + currentUserId);
                Poem.updateMany({ userId: currentUserId }, { penName: newPenName }, (err, foundPoems) => {
                    if (err) {
                        console.log(err);
                    } else {
                        // console.log("Updated Docs : ", foundPoems);
                        res.redirect("/account");
                    }
                });
            }
        })
    } else {
        res.redirect("/auth/login");
    }
});


app.listen(port, () => {
    console.log("Server started running on port 3000");
});


