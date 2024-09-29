const mongoose = require('mongoose');
const Mines = require('./models/mines'); // Adjust the path if necessary

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

mongoose.connect('mongodb://localhost:27017/mines', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!");
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!");
        console.log(err);
    });

async function deleteMines() {
    try {
        const result = await Mines.deleteMany({});
        console.log(`Deleted ${result.deletedCount} mines.`);
    } catch (err) {
        console.error("Error deleting mines:", err);
    } finally {
        mongoose.connection.close();
    }
}

deleteMines();