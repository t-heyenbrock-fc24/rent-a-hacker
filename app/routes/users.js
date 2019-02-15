// require dependencies
const bcrypt = require("bcryptjs");
const express = require("express");
const { MongoClient } = require("mongodb");
const config = require("../config/database");
const handleError = require("../src/handleError");

const router = express.Router();

// route for showing register form
router.get("/register", (req, res) => {
  // render register-view with user from session
  res.render("register", { user: req.session.user });
});

// register a user
router.post("/register", async (req, res) => {
  // check if user is already logged in
  if (req.session.user) {
    // send a notification message and redirect to dashboard
    req.session.message = "You are already logged in, so why register again?";
    res.redirect("/dashboard");
    return;
  }

  // get submitted username and passwords
  const username = req.body.username;
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;

  if (!username || !password || username === "" || password === "") {
    // username or password is empty
    handleError(
      req,
      res,
      "Please submit a username and a password.",
      "register"
    );
    return;
  }
  if (password !== passwordConfirm) {
    // passwords don't match
    handleError(req, res, "Passwords do not match.", "register");
    return;
  }

  let client;

  try {
    // generate salt
    const salt = bcrypt.genSaltSync(16);

    // hash the submitted password using the created salt
    const hash = bcrypt.hashSync(password, salt);

    // connect to mongodb
    client = await MongoClient.connect(config.url);
    // check for errors
    if (!client) {
      // connection not successful, render error message
      handleError(req, res, null, "register");
      return;
    }

    // get the database
    const db = client.db(config.database);

    // query user collection for all users with submitted username
    const docs = await db
      .collection("users")
      .find({ username })
      .toArray();

    // check if username already exists
    if (docs.length > 0) {
      // username already exists, render error message
      handleError(req, res, null, "register");
      return;
    }

    // insert user in user collection
    await db.collection("users").insert({
      username,
      password: hash
    });

    // set message in session object
    req.session.message = "Registration successful! You can now login.";

    // redirect to login
    res.redirect("/users/login");
  } catch (err) {
    console.log(err);
    handleError(req, res, null, "register");
  } finally {
    client && client.close();
  }
});

// login form
router.get("/login", (req, res) => {
  // check if user exists in session object
  if (req.session.user) {
    // user is already logged in, redirect to dashboard
    res.redirect("/dashboard");
    return;
  }

  // check session object for message
  let messages = [];
  if (req.session.message) {
    // push message into local array
    messages.push({
      text: req.session.message,
      color: "green darken-4"
    });
  }

  // delete message in session object
  delete req.session["message"];

  // render login-view with messages
  res.render("login", { messages });
});

// submit login form
router.post("/login", async (req, res) => {
  // check if user exists in session object
  if (req.session.user) {
    // user is already logged in, redirect to dashboard
    res.redirect("/dashboard");
    return;
  }

  // get submitted username and password
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password || username === "" || password === "") {
    // username or password is empty, render error message
    handleError(req, res, "Please submit your username and password.", "login");
    return;
  }

  let client;

  try {
    // connect to database
    client = await MongoClient.connect(config.url);

    if (!client) {
      // connection not successful, render error message
      handleError(req, res, null, "login");
      return;
    }

    // get the database
    const db = client.db(config.database);

    // query user collection for submitted username
    const docs = await db
      .collection("users")
      .find({ username })
      .toArray();

    // was any user found for the username
    const userFound = docs.length > 0;

    // get hash of the returned user, if no user was found use a dummy-hash
    const hash = userFound
      ? docs.pop().password
      : "$2a$16$G6BB8k/knhnof8jD7OaLQuDTJYhCJbk0VUVO1CbVkgcmbbhQn.boK";

    // compare submitted password with hash
    const result = bcrypt.compareSync(password, hash);

    if (result && userFound) {
      // user was found and password did match hash, set user in session object
      req.session.user = { username };

      // redirect to dashboard
      res.redirect("/dashboard");
      return;
    }

    // user was not found or password did not match hash, render error message
    handleError(req, res, "Wrong username or password.", "login");
  } catch (err) {
    console.log(err);
    handleError(req, res, null, "login");
  } finally {
    client && client.close();
  }
});

// logout
router.get("/logout", (req, res) => {
  // remove user from session object
  delete req.session["user"];

  // redirect to homepage
  res.redirect("/");
});

// export router
module.exports = router;
