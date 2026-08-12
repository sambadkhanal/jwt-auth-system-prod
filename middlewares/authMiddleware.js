import jwt from "jsonwebtoken";
import "dotenv/config";

// It checks if the req has valid access_token in its authorization header and if its valid we attach user payload thats embedded in our access token in req ie req.user via jwt.verify()
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ msng: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ msng: "Invalid token" }); // 403 is forbidden which means you are authenticated but your token is not valid
    }

    // Decoded token payload is attached to the request object so that next middleware or route handler can access req.user ie id and role when it moves to next()
    req.user = user;
    next();
  });
};

// export const verifyRole = async (role) => {
//   return (req, res, next) => {};
// };

export const verifyRole = (role) => {
  return (req, res, next) => {
    const userRole = req.user?.role; // To prevent crashes if req.user is undefined
    if (userRole !== role) {
      return res.status(403).json({ msng: "Access denied" });
    }
    next();
  };
};
