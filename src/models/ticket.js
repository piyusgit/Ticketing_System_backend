const mongoose = require("mongoose");
const validator = require("validator");

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "low",
    },
    status: {
      type: String,
      enum: ["open", "in progress", "resolved", "closed"],
      default: "open",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment",
      },
    ],
    attachments: [
      {
        filename: String,
        url: String,
      },
    ],
    rating: {
      stars: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
    },
  },
  { timestamps: true }
);

const Ticket = mongoose.model("ticket", ticketSchema);
module.exports = Ticket;
