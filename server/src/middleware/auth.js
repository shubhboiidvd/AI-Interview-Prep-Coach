import jwt from "jsonwebtoken";
import User from "../schema/User.js";

export async function requireAuth(request, response, next) {
  try {
    const token =
      request.headers.authorization?.startsWith("Bearer ") ?
        request.headers.authorization.slice(7)
      : null;

    if (!token) {
      return response.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("-passwordHash");

    if (!user) {
      return response.status(401).json({ message: "User no longer exists" });
    }

    request.user = user;
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token" });
  }
}
