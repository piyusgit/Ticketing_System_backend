const express = require("express");
const User = require("../models/user");
const { userAuth, roleAuthorization } = require("../middlewares/auth");
const Ticket = require("../models/ticket");
const Comment = require("../models/comment");

const router = express.Router();

/**
 * Get all tickets assigned to the logged-in agent
 */
router.get(
  "/tickets",
  userAuth,
  roleAuthorization("agent"),
  async (req, res) => {
    try {
      const tickets = await Ticket.find({ assignedTo: req.user._id })
        .populate("comments") // if you want comments to show
        .populate("assignedTo", "name email"); // get agent info

      res.json(tickets);
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

/**
 * Update ticket status (only if assigned to the agent)
 */
router.patch(
  "/ticket/:ticketId/status",
  userAuth,
  roleAuthorization("agent"),
  async (req, res) => {
    try {
      const { status } = req.body;
      console.log(status);

      // Check if ticket belongs to this agent
      const ticket = await Ticket.findOne({
        _id: req.params.ticketId,
        assignedTo: req.user._id,
      });
      console.log("Agent:", req.user._id);
      console.log("Looking for ticket:", req.params.ticketId);

      if (!ticket) throw new Error("Ticket not found or not assigned to you");
      if (ticket.status === "closed")
        throw new Error("Ticket is already closed");

      ticket.status = status;
      const updatedTicket = await ticket.save();

      if (ticket.owner?.email) {
        await sendEmail(
          ticket.owner.email,
          `📢 Ticket Status Updated: ${ticket.subject}`,
          `Your ticket "${ticket.subject}" status has been updated to: ${status}.`,
          `<p>Hello <b>${ticket.owner.name}</b>,</p>
           <p>Your ticket <strong>${ticket.subject}</strong> status has been updated.</p>
           <p><strong>New Status:</strong> ${status}</p>`
        );
      }

      res.json({
        message: "Ticket status updated successfully",
        data: updatedTicket,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Update Ticket Status Error: ", err.message);
    }
  }
);

/**
 * Add comment (only if assigned to the agent)
 */
router.post(
  "/ticket/:ticketId/comment",
  userAuth,
  roleAuthorization("agent"),
  async (req, res) => {
    try {
      // Ensure ticket belongs to agent
      const ticket = await Ticket.findOne({
        _id: req.params.ticketId,
        assignedTo: req.user._id,
      });

      if (!ticket) throw new Error("Ticket not found or not assigned to you");

      const comment = new Comment({
        ticket: ticket._id,
        user: req.user._id,
        text: req.body.text,
      });

      const savedComment = await comment.save();

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
  agentRouter: router,
};
