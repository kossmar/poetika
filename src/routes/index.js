const express = require("express");
const { getLoginRoutes } = require("./auth/login");
const { getRegisterRoutes } = require("./auth/register");
const { getForgotPasswordRoutes } = require("./auth/forgotPassword");
const { getResetPasswordRoutes } = require("./auth/resetPassword");

function getRoutes() {
    const router = express.Router()
    router.use("/auth",
        [
            getLoginRoutes(),
            getRegisterRoutes(),
            getForgotPasswordRoutes(),
            getResetPasswordRoutes()
        ])

    // router.use("/poems", getPoemsRoutes())
    return router
}

module.exports = { getRoutes }