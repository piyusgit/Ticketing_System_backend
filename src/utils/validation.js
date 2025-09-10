const validator = require("validator");

const validateSignUpData = (req) => {
  const { name, email, password, role } = req.body;

  console.log(req.body);
  if (!name) {
    throw new Error("Name is required");
  } else if (!validator.isEmail(email)) {
    throw new Error("Invalid email:" + email);
  } else if (!password && password.length < 6) {
    throw new Error("Password is required");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a strong password");
  } else if (role !== "user" && role !== "agent" && role !== "admin") {
    throw new Error("Invalid role");
  }
};

module.exports = {
  validateSignUpData,
};
