const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mineSchema = new Schema({
    name: String,
    state: String,
    district: String,
    footprint: Number,
    coalType: String,
    qty: Number,
    image: String
})

module.exports = mongoose.model('Mine', mineSchema);