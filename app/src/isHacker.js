"use strict";

// require dependencies
const { MongoClient } = require("mongodb");
const config = require("../config/database");

// export function
module.exports = function isHacker(req, res, next) {
  // connect to database
  MongoClient.connect(config.database, (err, db) => {
    // check connection
    if (err || !db) {
      // connction failed, redirect to homepage with error message
      req.session.message = "Some unknown error occurred...";
      res.redirect("/");
      return;
    }

    // search hacker collection with current username
    db.collection("hackers")
      .find({ username: req.session.user.username })
      .toArray((err, docs) => {
        // close database connection
        db.close();

        // check for errors
        if (err) {
          // query not successful, redirect to homepase with error message
          req.session.message = "Some unknown error occurred...";
          res.redirect("/");
          return;
        }

        if (docs.length === 0) {
          // no docs were found, current user is no hacker, redirect to dashboard with error message
          req.session.message = "Only hackers may access that page.";
          res.redirect("/dashboard");
        } else {
          // current user is a hacker
          return next();
        }
      });
  });
};
