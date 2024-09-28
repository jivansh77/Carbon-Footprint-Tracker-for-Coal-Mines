const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const opts = { toJSON: {virtuals: true}};

const mineSchema = new Schema({
    name: String,
    state: String,
    district: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    image: String,
    description: String,
    footprint: {
        directEmission: Number,
        electricityUse: Number,
        transport: Number,
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
        cStock: Number,
    },
    result: {
        coalFootprint: Number,
        electricityFootprint: Number,
        transportFootprint: Number,
        deforestationFootprint: Number,
        totalFootprint: Number
    }
}, opts)

mineSchema.virtual('properties.popUp').get(function(){
    return `<h5>
                <b>
                <a href="index/${this._id}">${this.name}</a>
                </b>    
            </h5>
            <p>
                ${this.description.substring(0, 50)}...
            </p>`
})

module.exports = mongoose.model('Mine', mineSchema);