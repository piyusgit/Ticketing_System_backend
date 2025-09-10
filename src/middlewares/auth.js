const jwt = require("jsonwebtoken");
const User = require("../models/user");
const dotenv = require("dotenv");
dotenv.config();

const userAuth = async (req, res, next) => {
  try {
    // Read the token from the cookie
    const token = req.cookies.userToken;
    // console.log(token);
    console.log("User Token");

    if (!token) {
      return res.status(401).json({ message: "Unauthorized, no token" });
    }
    // verify the token

    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedObj._id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized, user not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(400).send("ERROR: " + err.message);
  }
};

// Role-based authorization middleware
const roleAuthorization = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden, access denied" });
    }
    next();
  };
};

module.exports = {
  userAuth,
  roleAuthorization,
};
