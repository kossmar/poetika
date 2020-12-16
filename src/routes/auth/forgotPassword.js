const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const async = require("async");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { User } = require("../../models/User");
const Messages = require("../../messages");






function getForgotPasswordRoutes() {
    const router = express.Router()
    router.route("/forgotPassword")
        .get(forgotPasswordGET)
        .post(forgotPasswordPOST)
    return router
}

var isAuthenticated = false;

function forgotPasswordGET(req, res) {
    if (req.user) {
        console.log(req.user);
        isAuthenticated = true;
    }
    res.render("forgot-password", {
        isAuthenticated: isAuthenticated,
    });
}

function forgotPasswordPOST(req, res) {

    const email = req.body.email
    console.log(email);
    async.waterfall([
        (done) => {
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        (token, done) => {
            User.findOne({ username: email }, (err, foundUser) => {
                if (err) {
                    console.log(err);
                } else {
                    if (foundUser) {
                        console.log(foundUser);
                        foundUser.resetPasswordToken = token,
                            foundUser.resetPasswordExpires = Date.now() + 3600000;

                        foundUser.save((err) => {
                            done(err, token, foundUser);
                        });
                    } else {
                        const error = Messages.passwordReset_WrongEmailMsg;
                        res.render("forgot-password", {
                            isAuthenticated: false,
                            error: error
                        })
                    }
                }
            });
        },
        (token, foundUser, done) => {
            let transporter = nodemailer.createTransport({
                host: "smtp-relay.sendinblue.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SENDER_EMAIL,
                    pass: process.env.SENDER_PASSWORD
                }
            });

            const recipient = email + " <" + email + ">";

            let message = {
                from: 'Poetica <help@poetica.com>',
                to: recipient,
                subject: "Poetica Password Reset",
                text: "",
                html: "<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                    "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                    "http://" + req.headers.host + "/auth/resetPassword/" + token + "\n\n</p>" +
                    "<p>If you did not request this, please ignore this email and your password will remain unchanged.\n</p>"
            };

            transporter.sendMail(message, (err, info) => {
                if (err) {
                    console.log('Error occurred. ' + err.message);
                    res.render("forgot-password", {
                        isAuthenticated: false,
                        error: Messages.passwordReset_LinkEmailErrorMsg
                    })
                    return process.exit(1);
                }

                done(err, email);
            });
        }
    ], (err, email) => {
        if (err) {
            const error = Messages.passwordResetGenericErrorMsg(err);
            res.render("forgot-password", {
                isAuthenticated: false,
                error: error
            })
            throw new Error(err);
        } else {
            const message = Messages.passwordResetLinkConfirmationMsg(email);
            res.render("forgot-password", {
                isAuthenticated: false,
                message: message
            })
        }
    });

}

module.exports = { getForgotPasswordRoutes }