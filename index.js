const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const express = require("express");
const admin = require("firebase-admin");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.static("assetadd"));
const serviceAccount = require("./serviceAccountKey.json");

// const firebaseConfig = {
//   apiKey: "AIzaSyAbayl_n8yI-q2t5JQsjzNplzPedQtGxzM",
//   authDomain: "shiva-3ba08.firebaseapp.com",
//   projectId: "shiva-3ba08",
//   storageBucket: "shiva-3ba08.appspot.com",
//   messagingSenderId: "680507297271",
//   appId: "1:680507297271:web:5ab670e5ae09e5a7f2b2f2",
//   measurementId: "G-9XJL6XPFX2"
// };

// firebase.initializeApp(firebaseConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shiva-3ba08.firebaseio.com",
});

const csrfMiddleware = csrf({ cookie: true });

const PORT = process.env.PORT || 3000;

app.engine("html", require("ejs").renderFile);

app.use(bodyParser.json());
app.use(cookieParser());
var parseForm = bodyParser.urlencoded({ extended: false });

// app.use(csrfMiddleware);
const db = admin.firestore().collection("users");
const freesignal = admin.firestore().collection("freesignal");
// const prosignal = admin.firestore().collection("prosignal");
// const premiumsignal = admin.firestore().collection("premiumsignal");

// app.all("*", (req, res, next) => {
//   res.cookie("XSRF-TOKEN", req.csrfToken());
//   next();
// });

app.get("/login", function (req, res) {
  res.sendFile(path.join(__dirname + "/login.html"));
});

app.get("/signup", function (req, res) {
  res.sendFile(path.join(__dirname + "/signup.html"));
});

app.get("/profile", function (req, res) {
  const sessionCookie = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((userData) => {
      const profileData = db.doc(userData.email);
      profileData.get().then(function (mydata) {
        if (mydata.data().usertype == "free") {
          freesignal.get().then(function (signaldata) {
            const signalgetdata = signaldata.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            console.log("signal data: ", JSON.stringify(signalgetdata));
            console.log("mydata: " + mydata.data());
            res.render("profile.html", { data: mydata.data(),doc: signalgetdata });
          });
        }
      });
    })
    .catch((error) => {
      res.redirect("/login");
    });
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.post("/sessionLogin", (req, res) => {
  const idToken = req.body.idToken.toString();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success" }));
        console.log("Session login");
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    )
    .then((error) => {
      console.log(error);
    });
});

app.get("/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/login");
});

app.get("/getdetails", csrfMiddleware, function (req, res) {
  res.render("details.html", { csrfToken: req.csrfToken() });
});
app.post("/details", parseForm, csrfMiddleware, function (req, res, next) {
  const sessionCookie = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((userData) => {
      console.log("Logged in:", userData.email);
      const user = db.doc(userData.email);
      user
        .set({
          name: req.body.name,
          age: req.body.age,
          email: userData.email,
          phone: req.body.phone,
          usertype: "free",
          broker: req.body.broker,
          balance: req.body.balance,
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((error) => {
      res.redirect("/login");
    });
  // req.body object has your form values
  console.log(req.body.name);
  console.log(req.body.age);
  res.redirect("/profile");
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
