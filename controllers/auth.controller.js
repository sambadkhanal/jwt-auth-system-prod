import User from "../models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msng: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ msng: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ msng: "User registered successfully" });
  } catch (err) {
    return res.status(500).json({ msng: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msng: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msng: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msng: "Invalid email or password" });
    }

    // ---------- JWT AUTH ----------

    // Short lived token thats sent by server and stored in browser and sent with request to prove identity
    const accessToken = jwt.sign(
      {
        id: user._id,
        roles: user.roles,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" },
    );

    // It is used to keep the user logged in even when the access token expires
    const refreshToken = jwt.sign(
      {
        id: user._id,
        roles: user.roles,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1h" }, // After 7 days browser will automatically delete cookie
    );

    // refresh token is stored in http only cookie in browser and browser will automatically send it with future requests and we can use it in backend to refresh access token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // It prevents cookie from being sent along with cross site request and prevents cross site forgery attacks
      // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxAge: 60 * 60 * 1000, // Matching it with refresh token expires time
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (err) {
    console.log("Error in login controller: ", err.stack);
    return res.status(500).json({ msng: "Internal Server Error" });
  }
};

// Without this the user will have to login every 15m(custom exp time)
export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ msng: "Refresh token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ msng: "Invalid or expired refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, roles: user.roles },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" },
    );

    res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (err) {
    console.log("Error occured in refreshToken controller: ", err.stack);
    return res.status(401).json({ msng: "Invalid or expired refresh token" });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxAge: 60 * 60 * 1000, // Matching it with refresh token expires time
    });

    res.status(200).json({ msng: "Logged out successfully" });
  } catch (err) {
    console.log("Error inside logout controller: ", err.stack);
    return res.status(500).json({ msng: "Internal Server Error" });
  }
};
