const express = require("express");

function getAboutRoute() {
    const router = express.Router()
    router.get("/about", aboutGET)

    return router
}

function aboutGET(req, res) {
    res.render("about", {
        isAuthenticated: req.isAuthenticated()
    });
}

module.exports = { getAboutRoute }