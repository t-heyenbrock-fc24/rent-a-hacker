// require dependencies
const fs = require("fs");
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const nodeRSA = require("node-rsa");
const config = require("../config/database");
const handleError = require("../src/handleError");
const isHacker = require("../src/isHacker");
const isLoggedIn = require("../src/isLoggedIn");

const router = express.Router();

// display dashboard
router.get("/", isLoggedIn, async (req, res) => {
  // check for messages in session object
  let messages = [];
  if (req.session.message) {
    // message object exists, save it in local variable
    messages.push({
      text: req.session.message,
      color: "green darken-4"
    });
  }
  // delete message in session object
  delete req.session["message"];

  let client;

  try {
    // connct to database
    client = await MongoClient.connect(config.url);
    // check connection
    if (!client) {
      // connection not successful, render error message
      handleError(req, res);
      return;
    }

    // get the database
    const db = client.db(config.database);

    // query hacker collection for all hackers
    const hackers = await db
      .collection("hackers")
      .find()
      .toArray();

    // check if current user is a hacker
    const isHacker = hackers.some(
      hacker => hacker.username === req.session.user.username
    );

    if (isHacker) {
      // current user is a hacker, query request collection for all his requests
      const requests = await db
        .collection("requests")
        .find({ hacker: req.session.user.username })
        .sort({ created: -1 })
        .toArray();

      // render dashboard for hacker with all requests
      res.render("dashboard", {
        user: req.session.user,
        isHacker,
        requests
      });
    } else {
      // current user is no hacker, render dashboard for normal user with all hackers
      res.render("dashboard", {
        user: req.session.user,
        isHacker,
        allHackers: hackers
      });
    }
  } catch (err) {
    console.log(err);
    handleError(req, res);
  } finally {
    client && client.close();
  }
});

// display dashboard with filtered requests (by tag)
router.post("/search", isLoggedIn, isHacker, async (req, res) => {
  let client;

  try {
    // connect to database
    const client = await MongoClient.connect(config.url);
    // check for errors
    if (!client) {
      // connection not successful, render error message
      handleError(req, res);
      return;
    }

    // get the database
    const db = client.db(config.database);

    // query request collection for all request of the current hacker
    const docs = await db
      .collection("requests")
      .find({ hacker: req.session.user.username })
      .toArray();

    // check if the hacker did specify any tag to filter for
    if (!req.body.tag) {
      // the hacker did not specify a tag, render dashboard with all requests
      res.render("dashboard", {
        user: req.session.user,
        requests: docs,
        isHacker: req.session.user.username
      });
      return;
    }

    // create private rsa-key for decryption
    const key = new nodeRSA(fs.readFileSync("keys/rsa_2048_priv.pem", "utf8"), {
      encryptionScheme: "pkcs1"
    });

    // run through each request in the query result
    const requests = docs
      .map(doc => ({
        ...doc,
        decryptedData: eval("({" + key.decrypt(doc.data).toString() + "})")
      }))
      .filter(doc => doc.decryptedData.tags.includes(req.body.tag))
      .map(({ decryptedData, ...doc }) => doc);

    // render dashboard with those requests that did match the searched tag
    res.render("dashboard", {
      user: req.session.user,
      requests,
      isHacker: req.session.user.username,
      search: req.body.tag
    });
  } catch (err) {
    console.log(err);
    handleError(req, res);
  } finally {
    client && client.close();
  }
});

// display request form for a specific hacker
router.get("/request/:hacker", isLoggedIn, (req, res) => {
  // render request-view with user from session and hacker name from url
  res.render("request", { user: req.session.user, hacker: req.params.hacker });
  return;
});

// submit a request to a hacker
router.post("/request/:hacker", isLoggedIn, async (req, res) => {
  let client;

  try {
    // connect to database
    const client = await MongoClient.connect(config.url);

    // check for errors
    if (!client) {
      // connection not successful, render error message
      handleError(req, res);
      return;
    }

    // get the database
    const db = client.db(config.database);

    // insert the submitted form data in request collection
    await db.collection("requests").insert({
      user: req.session.user.username,
      hacker: req.params.hacker,
      data: req.body.data,
      ack: 0,
      created: new Date()
    });

    // set message in session object
    req.session.message = "You successfully sent a request.";

    // send success
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    handleError(req, res);
  } finally {
    client && client.close();
  }
});

// view a specific request
router.get("/view/:id", isLoggedIn, isHacker, async (req, res) => {
  let client;

  try {
    // connect to database
    const client = await MongoClient.connect(config.url);

    // check for errors
    if (!client) {
      // connection not successful, render error message
      handleError(req, res);
      return;
    }

    // get the database
    const db = client.db(config.database);

    // query request collection for the specific request
    const docs = await db
      .collection("requests")
      .find({ _id: ObjectId(req.params.id), hacker: req.session.user.username })
      .toArray();

    if (docs.length === 0) {
      // no request was found for the current hacker, render error message
      handleError(req, res, "This is not the request you are looking for...");
      return;
    }

    // save result locally
    const request = docs.pop();

    // create rsa-key for decryption
    const key = new nodeRSA(fs.readFileSync("keys/rsa_2048_priv.pem", "utf8"), {
      encryptionScheme: "pkcs1"
    });

    // decrypt request data
    request.data = eval("({" + key.decrypt(request.data).toString() + "})");

    // join tag array to string
    request.data.tags = request.data.tags.join(",");

    // render view-view with current user and request
    res.render("view", { user: req.session.user, request });
  } catch (err) {
    console.log(err);
    handleError(req, res);
    return;
  } finally {
    client && client.close();
  }
});

// accept or reject request
router.post("/action/:id", isLoggedIn, isHacker, async (req, res) => {
  let client;

  try {
    // connect to database
    client = await MongoClient.connect(config.url);

    // check for errors
    if (!client) {
      // connection not successful
      handleError(req, res);
      return;
    }

    // get the database
    const db = client.db(config.database);

    // update request with submitted id
    const result = await db
      .collection("requests")
      .update(
        { _id: ObjectId(req.body.id) },
        { $set: { ack: req.body.action } }
      );

    // check for errors
    if (result.result.ok != 1) {
      // update not successful, render error message
      handleError(req, res);
      return;
    }

    // set message in session object
    req.session.message = "You successfully accepted this request.";

    // redirect to dashboard
    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    handleError(req, res);
    return;
  } finally {
    client && client.close();
  }
});

// export router
module.exports = router;
