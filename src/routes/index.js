const express = require("express");
const { getLoginRoutes } = require("./auth/login");
const { getRegisterRoutes } = require("./auth/register");
const { getForgotPasswordRoutes } = require("./auth/forgotPassword");
const { getResetPasswordRoutes } = require("./auth/resetPassword");
const { getFacebookAuthRoutes } = require("./auth/facebook");
const { getGoogleAuthRoutes } = require("./auth/google");
const { getPoemIdRoutes } = require("./poems/poemId");
const { getComposeRoutes } = require("./poems/compose");
const { getProfileRoutes } = require("./account/profile");
const { getHomeRoute } = require("./home/home");
const { getAboutRoute } = require("./home/about");

function getRoutes() {
    const router = express.Router()
    router.use("/auth",
        [
            getLoginRoutes(),
            getRegisterRoutes(),
            getForgotPasswordRoutes(),
            getResetPasswordRoutes(),
            getFacebookAuthRoutes(),
            getGoogleAuthRoutes(),
        ])

    router.use("/poems",
        [
            getPoemIdRoutes(),
            getComposeRoutes()
        ])

    router.use("/account",
        [
            getProfileRoutes()
        ])

    router.use("/",
        [
            getHomeRoute(),
            getAboutRoute()
        ])

    return router
}

module.exports = { getRoutes }