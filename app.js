//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  }));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.DBSECRET, { useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/',(req, res)=>{
    res.render("home");
});

app.get('/home',(req, res)=>{
    res.render("home");
});

app.get('/register',(req, res)=>{
    res.render("register");
});

app.get('/login',(req, res)=>{
    res.render("login");
});

app.get('/logout', function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.get('/secrets', (req, res) => {
    User.find({ secret: { $ne: null } })
        .then(foundUsers => {
            res.render("secrets", { userWithSecrets: foundUsers });
        })
        .catch(err => {
            console.log(err);
            res.redirect("/secrets");
        });
});

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) { 
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});



app.post('/register', (req, res) => {
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });
});


app.post('/login', (req, res)=>{
    const user = new User ({
        username : req.body.username,
        password : req.body.password
    });
    req.login(user, function(err){
        if(err) {
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
});

app.post('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        const submittedSecret = req.body.secret;

        // Create a new secret document
        const secret = new User({
            secret: submittedSecret
        });

        // Save the secret and associate it with the currently authenticated user
        User.findById(req.user._id)
            .then(user => {
                if (user) {
                    user.secret = submittedSecret;
                    return user.save();
                } else {
                    console.log('User not found.');
                    throw new Error('User not found');
                }
            })
            .then(() => {
                res.redirect("/secrets");
            })
            .catch(err => {
                console.log(err);
                res.redirect("/secrets");
            });
    } else {
        res.redirect("/login");
    }
});


app.listen(process.env.PORT, () => {
    console.log(`App is running on port ${process.env.PORT}`)
});





