const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mineSchema = new Schema({
    name: String,
    state: String,
    district: String,
    image: String,
    description: String,
    footprint: {
        directEmission: Number,
        electricityUse: Number,
        trnasport: Number,
        deforestation: Number,
        total: Number
    },
    factors: {
        coalQty: Number,
        coalType: {
            lignite: Number,
            subbitu: Number,
            bitu: Number,
            anthra: Number
        },
        electricityConsume: Number,
        eFactor: Number,
        fuelUse: {
            ddistance: Number,
            pdistance: Number,
            dfueleff: Number,
            pfueleff:Number
        },
        deforestedArea: Number,
        cStock: Number
    },
    result: {
        coalFootprint: Number,
        electricityFootprint: Number,
        transportFootprint: Number,
        deforestationFootprint: Number,
        totalFootprint: Number
    }
})

module.exports = mongoose.model('Mine', mineSchema);