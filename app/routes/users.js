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
router.post("/register", (req, res) => {
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

  // generate salt
  bcrypt.genSalt(16, (err, salt) => {
    // check for errors
    if (err) {
      // salt couln't be created, render error message
      handleError(req, res, null, "register");
      return;
    }

    // hash the submitted password using the created salt
    bcrypt.hash(password, salt, (err, hash) => {
      // check for errors
      if (err) {
        // password couldn't be hashed, render error message
        handleError(req, res, null, "register");
        return;
      }

      // connect to database
      MongoClient.connect(config.database, (err, db) => {
        // check for errors
        if (err || !db) {
          // connection not successful, render error message
          handleError(req, res, null, "register");
          return;
        }

        // query user collection for all users with submitted username
        db.collection("users")
          .find({ username })
          .toArray((err, docs) => {
            // check for errors
            if (err) {
              // query not successful, render error message
              handleError(req, res, null, "register");

              // close database connection
              db.close();
              return;
            }

            // check if username already exists
            if (docs.length > 0) {
              // username already exists, render error message
              handleError(req, res, null, "register");

              // close database connection
              db.close();
              return;
            }

            // insert user in user collection
            db.collection("users").insert(
              {
                username,
                password: hash
              },
              (err, result) => {
                // close database connection
                db.close();

                // check for errors
                if (err) {
                  // insert not successful, render error message
                  handleError(req, res, null, "register");
                  return;
                }

                // set message in session object
                req.session.message =
                  "Registration successful! You can now login.";

                // redirect to login
                res.redirect("/users/login");
              }
            );
          });
      });
    });
  });
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
router.post("/login", (req, res, next) => {
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

  // connect to database
  MongoClient.connect(config.database, (err, db) => {
    // check for errors
    if (err || !db) {
      // connection not successful, render error message
      handleError(req, res, null, "login");
      return;
    }

    // query user collection for submitted username
    db.collection("users")
      .find({ username })
      .toArray((err, docs) => {
        // close database connection
        db.close();

        // check for errors
        if (err) {
          // query not successful, render error message
          handleError(req, res, null, "login");
          return;
        }

        // was any user found for the username
        let userFound = docs.length > 0;

        // get hash of the returned user, if no user was found use a dummy-hash
        let hash = userFound
          ? docs.pop().password
          : "$2a$16$G6BB8k/knhnof8jD7OaLQuDTJYhCJbk0VUVO1CbVkgcmbbhQn.boK";

        // compare submitted password with hash
        bcrypt.compare(password, hash, (err, result) => {
          // check for errors
          if (err) {
            // comarison not successful, render error message
            handleError(req, res, null, "login");
            return;
          }

          if (result && userFound) {
            // user was found and password did match hash, set user in session object
            req.session.user = { username };

            // redirect to dashboard
            res.redirect("/dashboard");
            return;
          } else {
            // user was not found or password did not match hash, render error message
            handleError(req, res, "Wrong username or password.", "login");
            return;
          }
        });
      });
  });
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
