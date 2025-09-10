const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validator(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email:" + value);
        }
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      validator(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Enter Strong Password");
        }
      },
      //   select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ["user", "agent", "admin"],
      required: [true, "Role is required"],
      default: "user",
    },
  },
  { timestamps: true } // createdAt & updatedAt
);

// Schema Methods for Generating JWT Token
userSchema.methods.generateJWTToken = async function () {
  const user = this;
  const token = await jwt.sign(
    {
      _id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
  return token;
};

// Schema Methods for validating Password
userSchema.methods.validatePassword = async function (inputPassword) {
  const user = this;
  //   console.log(user);
  const isPasswordMatch = await bcrypt.compare(inputPassword, user.password);
  return isPasswordMatch;
};

const User = mongoose.model("user", userSchema);

module.exports = User;
