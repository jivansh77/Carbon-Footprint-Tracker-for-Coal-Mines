const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const Mines = require('./models/mines');
const maptilerClient = require("@maptiler/client");

if (process.env.NODE_ENV != 'production') {
  require('dotenv').config();
}

maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

mongoose.connect('mongodb://localhost:27017/mines', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
      console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch(err => {
      console.log("OH NO MONGO CONNECTION ERROR!!!!");
      console.log(err);
  });

const results = [];

fs.createReadStream('mine_data2.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    for (let row of results) {
      try {
        const {
          name,
          state,
          district,
          latitude,
          longitude,
          carbonFootprint,
          description,
          image
        } = row;

        // Parse numeric values
        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);
        const parsedCarbonFootprint = parseFloat(carbonFootprint);

        // Get coordinates
        let coordinates = [];
        if (!isNaN(parsedLatitude) && !isNaN(parsedLongitude)) {
          coordinates = [parsedLongitude, parsedLatitude];
        } else {
          // Geocode using district and state
          const address = `${district}, ${state}`;
          const geoData = await maptilerClient.geocoding.forward(address, { limit: 1 });
          coordinates = geoData.features[0]?.geometry?.coordinates || [0, 0];
        }

        // Create the mine document
        const mine = new Mines({
          name: name,
          state: state,
          district: district,
          geometry: {
            type: "Point",
            coordinates: coordinates
          },
          image: image || '/path/to/default/image.jpg',
          description: description || '',
          result: {
            totalFootprint: parsedCarbonFootprint
          }
        });

        await mine.save();
        console.log(`Saved mine: ${name}`);
      } catch (err) {
        console.error(`Error saving mine ${row['name']}:`, err);
      }
    }
    mongoose.connection.close();
  });