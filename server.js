const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const cookieParser = require("cookie-parser");

dotenv.config();
const app = express();

// Middleware

const corsOptions = {
  origin: "https://ticketing-system-phi-ten.vercel.app/", // "http://localhost:5173", // your frontend
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // include PATCH and OPTIONS
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false, // recommended
  optionsSuccessStatus: 204, // default for legacy browsers
};

app.use(cors(corsOptions));

/* The `app.options("*", cors());` code in the provided JavaScript file is setting up a pre-flight
request handler for all routes using the `OPTIONS` HTTP method. */
// app.options(/.*/, cors());
// app.options(
//   /.*/,
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//   })
// );

app.use(express.json());
app.use(cookieParser());

const { authRouter } = require("./src/routes/authRoute");
const { profileRouter } = require("./src/routes/profileRoute");
const { userRouter } = require("./src/routes/userRoute");
const { adminRouter } = require("./src/routes/adminRoute");
const { agentRouter } = require("./src/routes/agentRoute");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/agent", agentRouter);

// app.listen(process.env.PORT || 3000, () => {
//   console.log(`Server is running on port ${process.env.PORT || 3000}`);
// });

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
// U0pVJNd0e1NfbLNS
