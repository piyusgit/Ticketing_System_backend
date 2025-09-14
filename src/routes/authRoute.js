const express = require("express");
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    validateSignUpData(req); // Validating user data
    // Check if user already exists
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email: email });
    if (userExists) {
      throw new Error("User already exists");
    }
    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // console.log(hashedPassword);
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Saving user
    const savedUser = await newUser.save();
    // console.log(savedUser);

    const token = await newUser.generateJWTToken();
    console.log(token);

    // res.cookie("jwt", token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "none",
    // });
    res.cookie("userToken", token, {
      httpOnly: true,
      secure: true, //false, // true in production with HTTPS
      sameSite: "none", //"lax",
    });
    res.json({
      message: "User registered successfully",
      data: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
      token,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
    console.log(err.message);
  }
});

// Login Api
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const loggedUser = await User.findOne({
      email: email,
      role: role,
    });
    if (!loggedUser) {
      throw new Error("Invalid credentials, User not found");
    }
    const isPasswordMatch = await loggedUser.validatePassword(password);
    if (!isPasswordMatch) {
      throw new Error("Invalid credentials, Password does not match");
    }
    // Create a JWT token
    const token = await loggedUser.generateJWTToken();
    console.log("User Token: ", token);
    res.cookie("userToken", token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "lax",
    });
    res.json({
      message: "User logged in successfully",
      data: loggedUser,
      token,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
    console.log("Login Error: ", err.message);
  }
});

// Logout Api
router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("userToken");
    res.json({
      message: "User logged out successfully",
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = {
  authRouter: router,
};
