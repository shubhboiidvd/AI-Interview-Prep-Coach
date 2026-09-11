import mongoose from "mongoose";

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected");
  } catch (error) {
    if (error?.message?.toLowerCase().includes("authentication failed")) {
      throw new Error(
        "MongoDB authentication failed. Check the Atlas database username/password and confirm the user has access to this cluster.",
      );
    }
    throw error;
  }
}
