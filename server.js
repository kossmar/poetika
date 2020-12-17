//jshint esverison:8

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
// const passport = require("passport");
const { passport } = require("./src/workers/passportWorker");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const { doesNotMatch } = require("assert");
const flash = require("connect-flash");
const findOrCreate = require('mongoose-findorcreate');
const {getRoutes} = require('./src/routes');
const { User } = require("./src/models/User");
const { Poem } = require("./src/models/Poem");

const app = express();

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
}))

app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.message = req.flash('message');
    next();
})

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://mar-admin:" + process.env.MONGO_ADMIN_PASSWORD + "@cluster0.0saax.mongodb.net/poetikaDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
    domainURL = "http://localHost:3000"
}

app.use("/", getRoutes())

app.listen(port, () => {
    console.log("Server started running on port 3000");
});


