const express = require("express");
const passport = require("passport");

function getFacebookAuthRoutes() {
    const router = express.Router()
    router.get("/facebook", passport.authenticate('facebook'))
    router.get("/facebook/poetika", passport.authenticate('facebook', { failureRedirect: '/login' }),
        function (req, res) {
            // Successful authentication, redirect home.
            res.redirect('/');
        });
    return router
}

module.exports = { getFacebookAuthRoutes }