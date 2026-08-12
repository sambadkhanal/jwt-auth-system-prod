import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
// ...
import dotenv from "dotenv";
dotenv.config();
const app = express();

// Middlwares
app.set("trust proxy", 1);
// It tells browser to accept and store cookie sent from proxy (like Render, Nginx, Railway, Cloudflare)
// Telling browser to accept and store cookie from https://session-auth-system.onrender.com which is our live backend api deployed on Render(Proxy)

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500", // Live Server
      "http://localhost:5173", // Vite React App
    ],
    credentials: true, // Tells the browser: "It is okay to receive sensitive data (like cookies) during this cross-origin request." and now in frontend side you have to include {credentials: "include"} inside fetch
  }),
);

app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Database and Server
const PORT = process.env.PORT || 8080;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Mongodb connected");
    app.listen(PORT, () => {
      console.log(`Server is listening to the port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error while connecting to mongodb: ", err);
    process.exit(1); // Exit the process with failure
  });
