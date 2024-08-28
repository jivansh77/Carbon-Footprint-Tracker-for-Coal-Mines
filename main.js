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

mongoose.connect('mongodb://localhost:27017/mines')
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

app.get("/home", (req,res) =>{
    res.render("home");
})

app.get("/addmine", (req,res) =>{
    res.render("addmine", {places});
})

app.post("/index", async(req,res) =>{
    const mineData = req.body.Mine;
    const mine = new Mines(mineData);  
    await mine.save();
    res.redirect("/index");
})

app.get("/index", async(req,res) =>{
    const mines = await Mines.find({});
    res.render("index", {mines});
})

app.get("/index/:id", async(req,res) =>{
    console.log(req.params)
    const mines = await Mines.findById(req.params.id);
    res.render("show", {mines});
})

app.delete("/index/:id", async(req,res)=>{
    const mines = await Mines.findByIdAndDelete(req.params.id)
    res.redirect("/index");
})

app.get("/index/:id/edit", async(req,res) =>{
    console.log(req.params)
    const mines = await Mines.findById(req.params.id);
    res.render("edit", {mines});
})







app.get('/getCities', (req, res) => {
    const state = req.query.state;
    const selectedState = places.states.find(s => s.name === state);
    const cities = selectedState ? selectedState.districts.map(d => d.name) : [];
    res.json(cities);
});



app.listen("3000", ()=>{
    console.log("SERVER RUNNING.....................");
})