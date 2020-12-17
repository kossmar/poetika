const express = require("express");
const mongoose = require("mongoose");
const { Poem } = require("../../models/Poem");

function getComposeRoutes() {
    const router = express.Router()
    router.route("/compose")
        .get(composeGET)
        .post(composePOST)
    return router
}

function composeGET(req, res) {
    const isAuthenticated = req.isAuthenticated();
    if (isAuthenticated) {
        res.render("compose", {
            isAuthenticated: isAuthenticated,
        });
    } else {
        res.redirect("/auth/login");
    }
}

function composePOST(req, res) {
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
}

module.exports = { getComposeRoutes }
