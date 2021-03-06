const express = require("express");
const passport = require("passport");

function getLoginRoutes() {
    const router = express.Router()
    router.route("/login")
        .get(loginGET)
        .post(loginPOST)
    router.post("/logout", logoutPOST)
    return router
}

function loginGET(req, res) {
    var isAuthenticated = false;
    if (req.user) {
        console.log(req.user);
        isAuthenticated = true;
    }
    res.render("login", {
        isAuthenticated: isAuthenticated,
        messages: req.flash("error_msg")
    });
}

function loginPOST(req, res, next) {
    passport.authenticate("local",
        {
            successRedirect: "/",
            failureRedirect: "/auth/login",
            failureFlash: true
        })(req, res, next);
}

function logoutPOST(req, res) {
    req.logout();
    isAuthenticated = false;
    res.redirect("/");
}

module.exports = { getLoginRoutes }