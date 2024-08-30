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
            diesel: Number,
            petrol: Number,
            dfueleff: Number,
            pfueleff:Number
        },
        employeeCount: Number,
        deforestedArea: Number,
        cStock: Number
    }
})

module.exports = mongoose.model('Mine', mineSchema);