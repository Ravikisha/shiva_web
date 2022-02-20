const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shiva-3ba08.firebaseio.com",
});
const freesignal = admin.firestore().collection("freesignal");

const user = freesignal.doc();
user
  .set({
    signaldata: "Eternum 5% min",
    time: new Date()
  })
  .catch((err) => {
    console.log(err);
  });
