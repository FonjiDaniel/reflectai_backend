import jwt from "jsonwebtoken";
import { findUserByEmail, createUser } from "../models/user.model.js";
import process from "node:process";

export const signUpOrLogin = async (req, res, next) => {

    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

  try {
    const { name, email, clerkId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    let user = await findUserByEmail(email);


    if (!user) {
      user = await createUser(name, email, clerkId);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      message: "User authenticated successfully",
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
};


