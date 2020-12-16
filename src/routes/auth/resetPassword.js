const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const async = require("async");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { User } = require("../../../models/User");

function getResetPasswordRoutes() {
    const router = express.Router()
    router.route("/resetPassword/:token")
        .get(resetPasswordGET)
        .post(resetPasswordPOST)
    return router
}

var isAuthenticated = false;

function checkAuthentication(req) {
    if (req.user) {
        console.log(req.user);
        isAuthenticated = true;
    } 
}

function resetPasswordGET(req, res) {

    checkAuthentication(req);

    const token = req.params.token
    User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (!foundUser) {
                console.log("Password reset token has expired or is invalid");
                res.redirect("/forgotPassword");
            } else {
                res.render("reset-password", {
                    isAuthenticated: isAuthenticated,
                    token: token,
                });
            }
        }
    });
}

function resetPasswordPOST(req, res) {

    checkAuthentication(req);

    console.log(req.body.password);

    async.waterfall([
        (done) => {
            const token = req.params.token;
            User.findOne({ resetPasswordToken: token }, (err, foundUser) => {
                if (err) {
                    console.log(err);
                    res.redirect("resetPassword", {
                        isAuthenticated: isAuthenticated,
                        resetAlert: resetAlert
                    });
                } else {
                    // foundUser.password = req.body.password;
                    foundUser.setPassword(req.body.password, (err, thing) => {
                        if (err) {
                            console.log(err);
                        } else {
                            foundUser.resetPasswordToken = undefined;
                            foundUser.resetPasswordExpires = undefined;
                            console.log("FOUND USER before sending confirmation email " + foundUser);

                            foundUser.save((err) => {
                                done(err, foundUser);
                            });
                        }
                    });
                }
            });
        },
        (foundUser, done) => {
            let transporter = nodemailer.createTransport({
                host: "smtp-relay.sendinblue.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SENDER_EMAIL,
                    pass: process.env.SENDER_PASSWORD
                }
            });

            const email = foundUser.username;
            const recipient = email + " <" + email + ">";
            console.log("RECIPIENT of Confirmation: " + recipient);

            let message = {
                from: 'Poetica <help@poetica.com>',
                to: recipient,
                subject: "Poetica Password Reset",
                text: "",
                html: "<p>This is a confirmation that the password for your Poetica account has been successfully reset.</p>"
            };

            transporter.sendMail(message, (err, info) => {
                if (err) {
                    console.log('Error occurred. ' + err.message);
                    return process.exit(1);
                }

                console.log('Confirmation message sent: %s', info.messageId);
                done();
            });
        }
    ], (err) => {
        res.redirect("/login");
    });

}

module.exports = { getResetPasswordRoutes }