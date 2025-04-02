const express = require("express");
const { signUpOrLogin } = require("../controllers/authControler.js");

const authRoute = express.Router();

authRoute.post("/auth", signUpOrLogin);

module.exports = authRoute;
