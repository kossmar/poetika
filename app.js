//jshint esverison:8

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const alert = require("alert");
const nodemailer = require("nodemailer");
const SMTPConnection = require("nodemailer/lib/smtp-connection");
const crypto = require("crypto");
const { doesNotMatch } = require("assert");
const async = require("async");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb://localhost:27017/poeticaDB", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

mongoose.connect("mongodb+srv://mar-admin:" + process.env.MONGO_ADMIN_PASSWORD + "@cluster0.0saax.mongodb.net/poetikaDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    penName: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
        console.log("HOME - CURRENT USER: " + currentUser);
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
    console.log("REQUESTED ID: " + requestedPoemId);

    Poem.findOne({ _id: requestedPoemId }, (err, foundPoem) => {
        console.log(foundPoem);
        if (err) {
            console.log("THE FUCK IS THIS??: " + err);
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
    });
});

app.post("/login",
    passport.authenticate("local",
        {
            successRedirect: "/",
            failureRedirect: "/login",
        })
);

app.get("/register", (req, res) => {
    res.render("register", {
        isAuthenticated: isAuthenticated,
    });
})

app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const penName = req.body.penName;
    console.log(req.body);

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
});

app.post("/logout", (req, res) => {
    req.logout();
    isAuthenticated = false;
    res.redirect("/");
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
                console.log("currentPenName: " + foundUser.penName);
                console.log("newPenName: " + newPenName);
                foundUser.penName = newPenName;

                foundUser.save()
                console.log("currentUserId: " + currentUserId);
                Poem.updateMany({ userId: currentUserId }, { penName: newPenName }, (err, foundPoems) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Updated Docs : ", foundPoems);
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


