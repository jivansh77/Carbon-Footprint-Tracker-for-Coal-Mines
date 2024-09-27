const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const Mines = require('./models/mines');
const User = require('./models/user');
const places = require('./data/india-places');
const marketplaceRoutes = require('./marketplace/marketplace');
const authRoutes = require('./auth/auth');

app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'pages'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('pages'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

app.use(session({
    secret: 'keyboard cat', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/mines' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Session expires after 1 day
}));

app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            res.locals.currentUser = user;
        } catch (err) {
            console.error(err);
        }
    } else {
        res.locals.currentUser = null;
    }
    next();
});

mongoose.connect('mongodb://localhost:27017/mines', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!");
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!");
        console.log(err);
    });

app.use('/', authRoutes);

app.get("/home", (req, res) => {
    res.render("home");
})

app.get("/about", (req, res) => {
    res.render("aboutus");
})

app.get("/suggest", (req, res) => {
    res.render("suggest");
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

app.get("/calculate",(req, res) => {
    res.render("calculate", {places});
});

app.get("/index/:id/suggestions",(req, res) => {
    res.render("suggestions");
});

app.get("/index/:id", async (req, res) => {
    try {
        const mines = await Mines.findById(req.params.id);
        if (!mines) {
            return res.status(404).send("Mine not found");
        }
        res.render("show", {mines});
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

app.use('/marketplace', marketplaceRoutes);

app.listen("3000", () => {
    console.log("SERVER RUNNING.....................");
});
