import Route from "express";
import { signUpOrLogin } from "../controllers/authControler.js";

const authRoute = Route();

authRoute.post("/auth", signUpOrLogin);
export default authRoute;
