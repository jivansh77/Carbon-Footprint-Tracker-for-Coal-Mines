const express = require('express');
const app = express();
const path = require('path')
const methodOverride = require('method-override');
const mongoose = require("mongoose");
const Mines = require("./models/mines");
const ejsMate = require('ejs-mate');
const places = require("./data/india-places");

app.engine('ejs', ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

mongoose.connect('mongodb://localhost:27017/mines', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })

app.use(express.static('public'));
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'pages'));

app.get("/", (req, res) =>{
    res.render("home");
})

app.get("/home", (req,res) =>{
    res.render("home");
})

app.get("/addmine", (req,res) =>{
    res.render("addmine", {places});
})

app.get("/index", (req,res) =>{
    res.render("index", {Mines});
})








app.get('/getCities', (req, res) => {
    const state = req.query.state;
    const selectedState = places.states.find(s => s.name === state);
    const cities = selectedState ? selectedState.districts.map(d => d.name) : [];
    res.json(cities);
});



app.listen("9000", ()=>{
    console.log("SERVER RUNNING.....................");
})