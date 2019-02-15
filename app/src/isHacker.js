"use strict";

// require dependencies
const { MongoClient } = require("mongodb");
const config = require("../config/database");

// export function
module.exports = async function isHacker(req, res, next) {
  let client;

  try {
    // connect to database
    const client = await MongoClient.connect(config.url);
    // check connection
    if (!client) {
      // connction failed, redirect to homepage with error message
      req.session.message = "Some unknown error occurred...";
      res.redirect("/");
      return;
    }

    // get the database
    const db = client.db(config.database);

    // search hacker collection with current username
    const docs = await db
      .collection("hackers")
      .find({ username: req.session.user.username })
      .toArray();
    if (docs.length === 0) {
      // no docs were found, current user is no hacker, redirect to dashboard with error message
      req.session.message = "Only hackers may access that page.";
      res.redirect("/dashboard");
      return;
    }

    // current user is a hacker
    next();
  } catch (err) {
    console.log(err);
    req.session.message = "Some unknown error occurred...";
    res.redirect("/");
  } finally {
    client && client.close();
  }
};
