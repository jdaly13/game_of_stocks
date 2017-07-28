// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3090;
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var bcrypt       = require('bcrypt-nodejs');
var asynch        = require('async');
var crypto       = require('crypto');

var configDBurl = require('./config/database.js').url;

// configuration ===============================================================
mongoose.connect(configDBurl); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'thistleandfinch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport, crypto, asynch, nodemailer); // load our routes and pass in our app and fully configured passport
require('./app/api.js')(express, app, passport);
//app.use('/', express.static(__dirname + '/'));
app.use(express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);