const express = require("express");
const User = require("../models/user");
const { userAuth, roleAuthorization } = require("../middlewares/auth");
const Ticket = require("../models/ticket");
const Comment = require("../models/comment");
const sendEmail = require("../utils/email");

const router = express.Router();

// Creating the Ticket

router.post(
  "/ticket",
  userAuth,
  roleAuthorization("user"),
  async (req, res) => {
    try {
      const { subject, description, priority } = req.body;

      const ticket = new Ticket({
        subject,
        description,
        priority,
        status: "open",
        owner: req.user._id,
      });
      const savedTicket = await ticket.save();
      console.log(savedTicket);
      // 🔹 Fetch user details for email
      const user = await User.findById(req.user._id);

      // 🔹 Send Email Notification
      await sendEmail(
        user.email,
        `🎫 Ticket Created: #${savedTicket._id}`,
        `
          <h3>Hi ${user.name},</h3>
          <p>Your ticket has been created successfully.</p>
          <p><strong>Subject:</strong> ${savedTicket.subject}</p>
          <p><strong>Priority:</strong> ${savedTicket.priority}</p>
          <p>Status: ${savedTicket.status}</p>
          <hr/>
          <p>We will get back to you soon.</p>
        `
      );
      res.json({
        message: "Ticket created successfully",
        data: savedTicket,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Create Ticket Error: ", err.message);
    }
  }
);

// view the ticket
router.get(
  "/ticket/myTickets",
  userAuth,
  roleAuthorization("user"),
  async (req, res) => {
    try {
      const tickets = await Ticket.find({ owner: req.user._id })
        .populate("owner", "-password")
        .populate("assignedTo")
        .populate("comments")
        .sort({ createdAt: -1 });
      if (!tickets) {
        throw new Error("No tickets found");
      }
      console.log(tickets);
      res.status(200).json(tickets);
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

// get Single Ticket
router.get(
  "/ticket/:ticketId",
  userAuth,
  roleAuthorization("user"),
  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.ticketId)
        .populate("owner", "-password")
        .populate("assignedTo")
        .populate("comments");
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      console.log(ticket);
      res.status(200).json(ticket);
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

// Add comment
router.post(
  "/ticket/:ticketId/comment",
  userAuth,

  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      // Users can only comment on their own tickets
      if (ticket.owner.toString() !== req.user._id.toString()) {
        throw new Error("You can only comment on your own tickets");
      }
      const comment = new Comment({
        ticket: ticket._id,
        user: req.user._id,
        text: req.body.text,
      });
      const savedComment = await comment.save();
      console.log(savedComment);
      // Step 2: Push comment ID into ticket
      ticket.comments.push(savedComment._id);
      await ticket.save();

      res.status(201).json({
        message: "Comment added successfully",
        data: savedComment,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

module.exports = {
  userRouter: router,
};
