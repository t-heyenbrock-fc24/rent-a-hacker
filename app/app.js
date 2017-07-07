'use strict';

// require dependencies
const bodyParser = require('body-parser');
const config = require('./config/database');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const express = require('express');
const favicon = require('serve-favicon');
const handleError = require('./src/handleError');
const helmet = require('helmet');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const sessionConfig = require('./config/session');

// create app
const app = express();

// set public directory
app.use(express.static(path.join(__dirname, 'public')));

// serve facivon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

// set template directory
app.set('views', path.join(__dirname, 'views'));

// set template engine
app.set('view engine', 'pug');

// body-parser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// cookie-session middleware
app.use(cookieParser());
app.use(cookieSession({
    name: 's4zF80L1sb3yy0Eu',
    keys: sessionConfig.keys,
    maxAge: 24 * 60 * 60 * 1000
}));

// helmet middleware
app.use(helmet());

// homepage
app.get('/', (req, res) => {
    // render index-view with user from session object
    res.render('index', {user: req.session.user});
    return;
});

// contact form
app.get('/contact', (req, res) => {
    // render contact-view with user from session object
    res.render('contact', {user: req.session.user});
    return;
});

// submit contact form
app.post('/contact', (req, res) => {
    // connect to database
    MongoClient.connect(config.database, (err, db) => {
        // check for errors
        if (err || !db) {
            // connection not successful, render error message
            console.log(err);
            handleError(req, res);
            return;
        }

        // insert data from contact into contact collection
        db.collection('contacts').insert(req.body, (err, result) => {
            // close database connection
            db.close();

            // check for errors
            if (err) {
                // insert not successful, render error message
                console.log(err);
                handleError(res, 'Some unknown error occurred...');
                return;
            }

            // render layout-view with success message
            res.render('layout', {
                messages: [{
                    text: 'We recieved your contact form and will send an answer as soon as possible.',
                    color: 'green darken-4'
                }],
                user: req.session.user
            });
            return;
        });
    });
});

// about page
app.get('/about', (req, res) => {
    // render about view with user from session object
    res.render('about', {user: req.session.user});
    return;
});

// other routes
app.use('/users', require('./routes/users'));
app.use('/dashboard', require('./routes/dashboard'));

// start server
const port = 8080;
app.listen(port, () => {
    console.log('Server started on port ' + port + '...');
});
