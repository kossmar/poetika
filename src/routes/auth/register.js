const express = require("express");
const passport = require("passport");
const async = require("async");
const { User } = require("../../models/User");

// Register Routes

function getRegisterRoutes() {
    const router = express.Router()
    router.route("/register")
        .get(registerGET)
        .post(registerPOST)
    return router
}


// Route Functions 

function registerGET(req, res) {
    var isAuthenticated = false;
    if (req.user) {
        console.log(req.user);
        isAuthenticated = true;
    }
    res.render("register", {
        isAuthenticated: isAuthenticated,
    });
}

async function registerPOST(req, res) {
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
        var isAuthenticated = false;
        if (req.user) {
            console.log(req.user);
            isAuthenticated = true;
        }
        res.render("register", {
            isAuthenticated: isAuthenticated,
            errors: errors,
            penName: penName,
            username: username,
            password: password,
            passwordConf: passwordConf
        })
    }
}

module.exports = { getRegisterRoutes }