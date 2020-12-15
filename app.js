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
const nodemailer = require("nodemailer");
const SMTPConnection = require("nodemailer/lib/smtp-connection");
const crypto = require("crypto");
const { doesNotMatch } = require("assert");
const async = require("async");
const flash = require("connect-flash");
const findOrCreate = require('mongoose-findorcreate');


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
    next();
})

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://mar-admin:" + process.env.MONGO_ADMIN_PASSWORD + "@cluster0.0saax.mongodb.net/poetikaDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    penName: String,
    googleId: String,
    facebookId: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);


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
        callbackURL: "https://poetika.herokuapp.com/auth/facebook/poetika"
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
    callbackURL: "https://poetika.herokuapp.com/auth/google/poetika",
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

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

var isAuthenticated = false;

const poemSchema = mongoose.Schema({
    title: String,
    body: String,
    penName: String,
    userId: String,
    timeStamp: Number,
});

const Poem = new mongoose.model("Poem", poemSchema);


// console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)

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

app.get("/poems/:poemId", (req, res) => {

    const requestedPoemId = req.params.poemId;

    Poem.findOne({ _id: requestedPoemId }, (err, foundPoem) => {
        console.log(foundPoem);
        if (err) {
        } else {
            res.render("poem", {
                isAuthenticated: isAuthenticated,
                poem: foundPoem
            });
        }
    });
});

// AUTHENTICATE

app.get("/login", (req, res) => {
    res.render("login", {
        isAuthenticated: isAuthenticated,
        messages: req.flash("error_msg")
    });

});

app.post("/login", (req, res, next) => {
    passport.authenticate("local",
        {
            successRedirect: "/",
            failureRedirect: "/login",
            failureFlash: true
        })(req, res, next);
});

app.get("/register", (req, res) => {
    res.render("register", {
        isAuthenticated: isAuthenticated,
    });
})

app.post("/register", async (req, res) => {
    const { penName, username, password, passwordConf } = req.body;

    const errors = [];

    if (!penName || !username || !password || !passwordConf) {
        errors.push({ msg: "Please fill in all fields" });
    }

    // Check if passwords match
    if (password !== passwordConf) {
        errors.push({ msg: "Passwords don't match" })
    }

    // Check if pen name is taken
    let promise = new Promise((resolve, reject) => {
        User.findOne({ penName: penName }, (err, foundUser) => {
            if (foundUser) {
                errors.push({ msg: "Pen Name is taken" });
                resolve();
            } else {
                resolve();
            }
        })
    })

    let promise2 = new Promise((resolve, reject) => {
        // Check if e-mail address is registered
        User.findOne({ username: username }, (err, foundUser) => {
            if (foundUser) {
                errors.push({ msg: "This e-mail address is already registered" });
                resolve();
            } else {
                User.register({ username: username, penName: penName }, password, (err, user) => {
                    if (err) {
                        console.log(err);
                        res.redirect("/register");
                    } else {
                        passport.authenticate("local")(req, res, function () {
                            res.redirect("/");
                        });
                    }
                });
            }
        });
    })

    let result = await promise;
    let result2 = await promise2;

    if (errors.length > 0) {
        res.render("register", {
            isAuthenticated: isAuthenticated,
            errors: errors,
            penName: penName,
            username: username,
            password: password,
            passwordConf: passwordConf
        })
    }

});

// Facebook Auth 
app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/poetika',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

app.post("/logout", (req, res) => {
    req.logout();
    isAuthenticated = false;
    res.redirect("/");
});

// Google Auth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/poetika', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// RESET PASSWORD

var forgotAlert = {
    state: false,
    message: ""
}

app.get("/forgotPassword", (req, res) => {

    res.render("forgot-password", {
        isAuthenticated: isAuthenticated,
        alert: forgotAlert
    });
    forgotAlert.state = false;
    forgotAlert.message = "";
});

app.post("/forgotPassword", (req, res) => {

    const email = req.body.email
    console.log(email);
    async.waterfall([
        (done) => {
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        (token, done) => {
            User.findOne({ username: email }, (err, foundUser) => {
                if (err) {
                    console.log(err);
                } else {
                    if (foundUser) {
                        console.log(foundUser);
                        foundUser.resetPasswordToken = token,
                            foundUser.resetPasswordExpires = Date.now() + 3600000;

                        foundUser.save((err) => {
                            done(err, token, foundUser);
                        });
                    }
                }
            });
        },
        (token, foundUser, done) => {
            let transporter = nodemailer.createTransport({
                host: "smtp-relay.sendinblue.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SENDER_EMAIL,
                    pass: process.env.SENDER_PASSWORD
                }
            });

            const recipient = email + " <" + email + ">";
            console.log("RECIPIENT " + recipient);

            let message = {
                from: 'Poetica <help@poetica.com>',
                to: recipient,
                subject: "Poetica Password Reset",
                text: "",
                html: "<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                    "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                    "http://" + req.headers.host + "/resetPassword/" + token + "\n\n</p>" +
                    "<p>If you did not request this, please ignore this email and your password will remain unchanged.\n</p>"
            };

            transporter.sendMail(message, (err, info) => {
                if (err) {
                    console.log('Error occurred. ' + err.message);
                    return process.exit(1);
                }

                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                forgotAlert.state = true;
                forgotAlert.message = "A password reset link has been sent to " + email + ". The link will expire in 1 hour."
                done();
                // res.redirect("forgotPassword");
            });
        }
    ], (err) => {
        if (err) return next(err);
        res.redirect("/forgotPassword");
    });

});

var resetAlert = {
    state: false,
    message: ""
}

app.get("/resetPassword/:token", (req, res) => {
    const token = req.params.token
    User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (!foundUser) {
                console.log("Password reset token has expired or is invalid");
                res.redirect("/forgotPassword");
            } else {
                res.render("reset-password", {
                    isAuthenticated: isAuthenticated,
                    token: token,
                    resetAlert: resetAlert
                });
            }
        }
    });
});

app.post("/resetPassword/:token", (req, res) => {
    console.log(req.body.password);

    async.waterfall([
        (done) => {
            const token = req.params.token;
            User.findOne({ resetPasswordToken: token }, (err, foundUser) => {
                if (err) {
                    console.log(err);
                    res.redirect("resetPassword", {
                        isAuthenticated: isAuthenticated,
                        resetAlert: resetAlert
                    });
                } else {
                    // foundUser.password = req.body.password;
                    foundUser.setPassword(req.body.password, (err, thing) => {
                        if (err) {
                            console.log(err);
                        } else {
                            foundUser.resetPasswordToken = undefined;
                            foundUser.resetPasswordExpires = undefined;
                            console.log("FOUND USER before sending confirmation email " + foundUser);

                            foundUser.save((err) => {
                                done(err, foundUser);
                            });
                        }
                    });
                }
            });
        },
        (foundUser, done) => {
            let transporter = nodemailer.createTransport({
                host: "smtp-relay.sendinblue.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SENDER_EMAIL,
                    pass: process.env.SENDER_PASSWORD
                }
            });

            const email = foundUser.username;
            const recipient = email + " <" + email + ">";
            console.log("RECIPIENT of Confirmation: " + recipient);

            let message = {
                from: 'Poetica <help@poetica.com>',
                to: recipient,
                subject: "Poetica Password Reset",
                text: "",
                html: "<p>This is a confirmation that the password for your Poetica account has been successfully reset.</p>"
            };

            transporter.sendMail(message, (err, info) => {
                if (err) {
                    console.log('Error occurred. ' + err.message);
                    return process.exit(1);
                }

                console.log('Confirmation message sent: %s', info.messageId);
                done();
            });
        }
    ], (err) => {
        res.redirect("/login");
    });
});

// COMPOSE

app.get("/compose", (req, res) => {
    // console.log(req.user.id);
    const isAuthenticated = req.isAuthenticated();
    if (isAuthenticated) {
        res.render("compose", {
            isAuthenticated: isAuthenticated,
        });
    } else {
        res.redirect("/login");
    }
});

app.post("/compose", (req, res) => {
    console.log("NEW POEM: " + req.body);
    const title = req.body.title;
    const body = req.body.body;
    const newPoem = new Poem({
        title: title,
        body: body,
        timeStamp: new Date(),
        penName: req.user.penName,
        userId: req.user.id
    });

    console.log("NEW POEM: " + newPoem);
    newPoem.save((err) => {
        if (err) {
            console.log(err)
        } else {
            res.redirect("/");
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

app.get("/account", (req, res) => {
    if (isAuthenticated) {
        res.render("account", {
            isAuthenticated: isAuthenticated,
            currentUser: req.user
        });
    } else {
        res.redirect("/login");
    }
});

app.post("/change_pen_name", (req, res) => {
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
        res.redirect("/login");
    }
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, () => {
    console.log("Server started running on port 3000");
});


