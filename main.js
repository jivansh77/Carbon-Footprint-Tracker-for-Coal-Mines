const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const Mines = require('./models/mines');
const ejsMate = require('ejs-mate');
const places = require('./data/india-places');
const {spawn} = require('child_process');
const bodyParser = require('body-parser');

app.engine('ejs', ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('pages'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/mines', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!");
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!");
        console.log(err);
    });

app.use(express.static('public'));
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'pages'));

app.get("/home", (req, res) => {
    res.render("home");
})

app.post("/index", async (req, res) => {
    try {
        const mineData = req.body.Mine;
        const mine = new Mines(mineData);
        await mine.save();
        res.redirect("/index");
    } catch (err) {
        console.error("Error adding mine:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/index", async (req, res) => {
    try {
        const mines = await Mines.find({});
        res.render("index", { mines });
    } catch (err) {
        console.error("Error fetching mines:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.route("/calculate").get((req, res) => {
    res.render("calculate", {places});
    
    const python = spawn('python3', ['ml/ml_model.py', coalQty, elecConsump, transportation, deforestedArea]);
    python.stdout.on('data', (data) => {
        try {
            const result = JSON.parse(data.toString());
            res.json(result);
        } catch (error) {
            console.error("Error parsing JSON from Python script:", error);
            res.status(500).send("Internal Server Error: Failed to parse response from Python script");
        }
    });

    python.stderr.on('data', (data) => {
        console.error(`Error from Python script: ${data}`);
        res.status(500).send("Internal Server Error: Python script encountered an error");
    });

    python.on('exit', (code) => {
        console.log(`Python script exited with code ${code}`);
        if (code !== 0) {
            res.status(500).send("Internal Server Error: Python script did not exit cleanly");
        }
    });
});

app.get("/index/:id", async (req, res) => {
    try {
        const mines = await Mines.findById(req.params.id);
        if (!mines) {
            return res.status(404).send("Mine not found");
        }
        res.render("show", { mines });
    } catch (err) {
        console.error("Error fetching mine:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.delete("/index/:id", async (req, res) => {
    try {
        const mines = await Mines.findByIdAndDelete(req.params.id);
        if (!mines) {
            return res.status(404).send("Mine not found");
        }
        res.redirect("/index");
    } catch (err) {
        console.error("Error deleting mine:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.put("/index/:id", async (req, res) => {
    try {
        const mines = await Mines.findByIdAndUpdate(req.params.id, req.body.Mine, { new: true });
        if (!mines) {
            return res.status(404).send("Mine not found");
        }
        res.redirect(`/index/${mines.id}`);
    } catch (err) {
        console.error("Error updating mine:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/index/:id/edit", async (req, res) => {
    try {
        const mines = await Mines.findById(req.params.id);
        if (!mines) {
            return res.status(404).send("Mine not found");
        }
        res.render("edit", { mines, places });
    } catch (err) {
        console.error("Error fetching mine for edit:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/suggestions', (req, res) => {
    const { strategy_label } = req.query;
    let suggestions = req.query.suggestions;
    if (!Array.isArray(suggestions)) {
        suggestions = [];
    }
    res.render("suggestions", { strategy_label, suggestions });
});

app.get('/getCities', (req, res) => {
    try {
        const state = req.query.state;
        const selectedState = places.states.find(s => s.name === state);
        const cities = selectedState ? selectedState.districts.map(d => d.name) : [];
        res.json(cities);
    } catch (err) {
        console.error("Error fetching cities:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen("3000", () => {
    console.log("SERVER RUNNING.....................");
});
