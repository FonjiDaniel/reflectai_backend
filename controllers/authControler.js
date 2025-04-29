'use strict';

const jwt = require("jsonwebtoken");
const { findUserByEmail, createUser } = require("../models/user.model");
const process = require("node:process");
const {sendWelcomeEmail} = require("../services/emailService.js");

exports.signUpOrLogin = async (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
  const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN;

  try {
    const { name, email, clerkId } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    let user = await findUserByEmail(email);

    if (!user) {
      user = await createUser(name, email, clerkId);
      await sendWelcomeEmail(email, name);

    }


    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    res.status(200).json({
      success: true,
      message: "User authenticated successfully",
      data: { token, refreshToken, user },
    });
  } catch (error) {
    console.error(error)
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required" });
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }


      const newToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: { token: newToken, refreshToken: refreshToken },
      });
    });
  } catch (error) {
    next(error);
  }
}