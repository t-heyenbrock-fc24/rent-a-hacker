'use strict';

// require dependencies
const config = require('../config/database');
const express = require('express');
const handleError = require('../src/handleError');
const isHacker = require('../src/isHacker');
const isLoggedIn = require('../src/isLoggedIn');
const MongoClient = require('mongodb').MongoClient;
const nodeRSA = require('node-rsa');
const ObjectId = require('mongodb').ObjectId;
const router = express.Router();

// display dashboard
router.get('/', isLoggedIn, (req, res) => {
    // check for messages in session object
    let messages = [];
    if (req.session.message) {
        // message object exists, save it in local variable
        messages.push({
            text: req.session.message,
            color: 'green darken-4'
        });
    }
    // delete message in session object
    delete req.session['message'];

    // connct to database
    MongoClient.connect(config.database, (err, db) => {
        // check connection
        if (err || !db) {
            // connection not successful, render error message
            console.log(err);
            handleError(req, res);
            return;
        }

        // query hacker collection for all hackers
        db.collection('hackers').find().toArray((err, docs) => {
            // check for errors
            if (err) {
                // query not successful, render error message
                console.log(err);
                handleError(req, res);

                // close database connection
                db.close();
                return;
            }

            // check if current user is a hacker
            let hacker = false;
            for (let i = 0; i < docs.length; i++) {
                if (docs[i].username === req.session.user.username) {
                    hacker = true;
                }
            }

            if (hacker) {
                // current user is a hacker, query request collection for all his requests
                db.collection('requests').find({hacker: req.session.user.username}).sort({created: -1}).toArray((err, docs) => {
                    // close database connection
                    db.close();

                    // check for errors
                    if (err) {
                        // query not successful, render error message
                        console.log(err);
                        handleError(req, res);
                        return;
                    }

                    // render dashboard for hacker with all requests
                    res.render('dashboard', {user: req.session.user, hacker, requests: docs});
                    return;
                });
            } else {
                // close database connection
                db.close();

                // current user is no hacker, render dashboard for normal user with all hackers
                res.render('dashboard', {user: req.session.user, hacker, allHackers: docs});
                return;
            }
        });
    });
});

// display dashboard with filtered requests (by tag)
router.post('/search', isLoggedIn, isHacker, (req, res) => {
    // connect to database
    MongoClient.connect(config.database, (err, db) => {
        // check for errors
        if (err || !db) {
            // connection not successful, render error message
            console.log(err);
            handleError(req, res);
            return;
        }

        // query request collection for all request of the current hacker
        db.collection('requests').find({hacker: req.session.user.username}).toArray((err, docs) => {
            // close database connection
            db.close();

            // check for errors
            if (err) {
                // query not successful, render error message
                console.log(err);
                handleError(req, res);
            }

            // check if the hacker did specify any tag to filter for
            if (!req.body.tag) {
                // the hacker did not specify a tag, render dashboard with all requests
                res.render('dashboard', {user: req.session.user, requests: docs, hacker: req.session.user.username});
            }

            // create private rsa-key for decryption
            const key = new nodeRSA(require('fs').readFileSync('keys/rsa_2048_priv.pem', 'utf8'), {encryptionScheme: 'pkcs1'});

            // run through each request in the query result
            let requests = [];
            docs.forEach((doc, i) => {
                try {
                    // decrypt data
                    doc.data = eval('(' + key.decrypt(doc.data).toString() + ')');

                    // check if any tag matches the search of the hacker
                    if (doc.data.tags.findIndex((tag) => {return tag === req.body.tag}) >= 0) {
                        // a tag did match, push request in local array
                        requests.push(doc);
                    }
                } catch (err) {
                }
            });

            // render dashboard with those requests that did match the searched tag
            res.render('dashboard', {user: req.session.user, requests, hacker: req.session.user.username, search: req.body.tag});
            return;
        });
    });
});

// display request form for a specific hacker
router.get('/request/:hacker', isLoggedIn, (req, res) => {
    // render request-view with user from session and hacker name from url
    res.render('request', {user: req.session.user, hacker: req.params.hacker});
    return;
});

// submit a request to a hacker
router.post('/request/:hacker', isLoggedIn, (req, res) => {
    // connect to database
    MongoClient.connect(config.database, (err, db) => {
        // check for errors
        if (err || !db) {
            // connection not successful, render error message
            console.log(err);
            handleError(req, res);
            return;
        }

        // insert the submitted form data in request collection
        db.collection('requests').insert({
            user: req.session.user.username,
            hacker: req.params.hacker,
            data: req.body.data,
            ack: 0,
            created: new Date()
        }, (err, result) => {
            // close database connection
            db.close();

            // check for errors
            if (err) {
                // insert not successful, render error message
                console.log(err);
                handleError(req, res);
                return;
            }

            // send success
            res.sendStatus(200);
        });
    })
});

// view a specific request
router.get('/view/:id', isLoggedIn, isHacker, (req, res) => {
    // check if id in url is a valid ObjectId
    try {
        ObjectId(req.params.id);
    } catch (err) {
        // id is not a valid ObjectId, render error message
        console.log(err);
        handleError(req, res);
        return;
    }

    // connect to database
    MongoClient.connect(config.database, (err, db) => {
        // check for errors
        if (err || !db) {
            // connection not successful, render error message
            console.log(err);
            handleError(req, res);
            return;
        }

        // query request collection for the specific request
        db.collection('requests').find({_id: ObjectId(req.params.id), hacker: req.session.user.username}).toArray((err, docs) => {
            // close database connection
            db.close();

            // check for errors
            if (err) {
                // query not successful, render error message
                console.log(err);
                handleError(req, res);
                return;
            }

            if (docs.length === 0) {
                // no request was found for the current hacker, render error message
                handleError(req, res, 'This is not the request you are looking for...');
                return;
            } else {
                // save result locally
                let request = docs.pop();

                // create rsa-key for decryption
                const key = new nodeRSA(require('fs').readFileSync('keys/rsa_2048_priv.pem', 'utf8'), {encryptionScheme: 'pkcs1'});
                try {
                    // decrypt request data
                    request.data = eval('(' + key.decrypt(request.data).toString() + ')');

                    // join tag array to string
                    request.data.tags = request.data.tags.join(',');
                } catch (err) {
                    // decryption not successful, render error message
                    console.log(err);
                    handleError(req, res);
                    return;
                }

                // render view-view with current user and request
                res.render('view', {user: req.session.user, request});
                return;
            }
        });
    });
});

// accept or reject request
router.post('/action/:id', isLoggedIn, isHacker, (req, res) => {
    // check if id in url is valid ObjectId
    try {
        ObjectId(req.params.id);
    } catch (err) {
        // id in url is no valid ObjectId, render error message
        console.log(err);
        handleError(req, res);
        return;
    }

    // connect to database
    MongoClient.connect(config.database, (err, db) => {
        // check for errors
        if (err || !db) {
            // connection not successful
            console.log(err);
            handleError(req, res);
            return;
        }

        // update request with submitted id
        db.collection('requests').update({_id: ObjectId(req.body.id)}, {$set: {ack: req.body.action}}, (err, result) => {
            // close database connection
            db.close();

            // check for errors
            if (err || result.result.ok != 1) {
                // update not successful, render error message
                console.log(err);
                handleError(req, res);
                return;
            }

            // set message in session object
            req.session.message = 'You successfully accepted this request.';

            // redirect to dashboard
            res.redirect('/dashboard');
            return;
        });
    });
});

// export router
module.exports = router;
