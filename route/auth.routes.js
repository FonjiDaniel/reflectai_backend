const express = require("express");
const { signUpOrLogin,refreshToken } = require("../controllers/authControler.js");

const authRoutes = express.Router();

authRoutes.post("/auth", signUpOrLogin);
authRoutes.post("/auth/refresh",refreshToken);

module.exports = authRoutes;
