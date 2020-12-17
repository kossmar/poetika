const express = require("express");
const { Poem } = require("../../models/Poem");

function getHomeRoute() {
    const router = express.Router()
    router.get("/", homeGET)

    return router
}

function homeGET(req, res) {
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
}

module.exports = { getHomeRoute }