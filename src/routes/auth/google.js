const express = require("express");
const passport = require("passport");

function getGoogleAuthRoutes() {
    const router = express.Router()
    router.get("/google", passport.authenticate('google', { scope: ['profile'] }))
    router.get("/google/poetika", passport.authenticate("google", { failureRedirect: '/login' }),
        function (req, res) {
            // Successful authentication, redirect home.
            res.redirect('/');
        });
    return router
}

module.exports = { getGoogleAuthRoutes }