const express = require("express");


function getProfileRoutes() {
    const router = express.Router()
    router.route("/profile")
        .get(profileGET)

    return router
}

function profileGET(req, res) {
    const isAuthenticated = req.isAuthenticated()
    if (isAuthenticated) {
        res.render("account", {
            isAuthenticated: isAuthenticated,
            currentUser: req.user
        });
    } else {
        res.redirect("/auth/login");
    }
}

module.exports = { getProfileRoutes }

