import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import User from "../schema/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, handleValidation } from "../middleware/validation.js";

const router = express.Router();
const credentials = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
];

function signToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function serializeUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

router.post(
  "/register",
  [body("name").trim().isLength({ min: 2 }), ...credentials, handleValidation],
  asyncHandler(async (request, response) => {
    const { name, email, password } = request.body;
    if (await User.exists({ email }))
      return response
        .status(409)
        .json({ message: "An account with that email already exists" });
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    response
      .status(201)
      .json({ user: serializeUser(user), token: signToken(user) });
  }),
);

router.post(
  "/login",
  [...credentials, handleValidation],
  asyncHandler(async (request, response) => {
    const user = await User.findOne({ email: request.body.email });
    if (
      !user ||
      !(await bcrypt.compare(request.body.password, user.passwordHash))
    )
      return response
        .status(401)
        .json({ message: "Email or password is incorrect" });
    response.json({ user: serializeUser(user), token: signToken(user) });
  }),
);

router.get("/me", requireAuth, (request, response) =>
  response.json({ user: serializeUser(request.user) }),
);

export default router;
