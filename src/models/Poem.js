const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const poemSchema = mongoose.Schema({
    title: String,
    body: String,
    penName: String,
    userId: String,
    timeStamp: Number,
});

const Poem = new mongoose.model("Poem", poemSchema);

module.exports = { Poem }