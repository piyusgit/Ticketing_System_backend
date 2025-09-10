const express = require("express");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/profile", userAuth, async (req, res) => {
  try {
    // remove sensitive info
    const { _id, name, email, role, createdAt } = req.user;
    res.json({
      id: _id,
      name,
      email,
      role,
      createdAt,
    });
  } catch (err) {
    res.status(400).json({ message: "ERROR: " + err.message });
  }
});

module.exports = {
  profileRouter: router,
};
