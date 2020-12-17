const express = require("express");
const { Poem } = require("../../models/Poem");

function getPoemIdRoutes() {
    const router = express.Router()
    router.route("/poem/:poemId")
        .get(poemIdGET)

    return router
}

function poemIdGET(req, res) {
    const requestedPoemId = req.params.poemId;
    Poem.findOne({ _id: requestedPoemId }, (err, foundPoem) => {
        console.log(foundPoem);
        if (err) {
        } else {
            res.render("poem", {
                isAuthenticated: req.isAuthenticated(),
                poem: foundPoem
            });
        }
    });
}

module.exports = { getPoemIdRoutes }