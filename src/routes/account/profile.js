const express = require("express");
const { User } = require("../../models/User");
const { Poem } = require("../../models/Poem");



function getProfileRoutes() {
    const router = express.Router()
    router.route("/profile")
        .get(profileGET)

    router.post("/change_pen_name", changeNamePOST)    
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

function changeNamePOST(req, res) {
    const isAuthenticated = req.isAuthenticated()
    if (isAuthenticated) {
        const currentUserId = req.user.id;
        const newPenName = req.body.newPenName;
        User.findOne({ _id: currentUserId }, (err, foundUser) => {
            if (foundUser) {
                console.log(foundUser);

                foundUser.penName = newPenName;

                foundUser.save()
                console.log(foundUser);
                Poem.updateMany({ userId: currentUserId }, { penName: newPenName }, (err, foundPoems) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/account/profile");
                    }
                });
            }
        })
    } else {
        res.redirect("/auth/login");
    }
}

module.exports = { getProfileRoutes }

