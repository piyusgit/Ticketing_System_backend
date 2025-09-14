const express = require("express");
const User = require("../models/user");
const { userAuth, roleAuthorization } = require("../middlewares/auth");
const Ticket = require("../models/ticket");
const Comment = require("../models/comment");
const sendEmail = require("../utils/email");

const router = express.Router();

// get all tickets
router.get(
  "/tickets",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const allTickets = await Ticket.find()
        .populate("owner", "-password")
        .populate("assignedTo");

      if (!allTickets) {
        throw new Error("No tickets found");
      }
      res.status(200).json(allTickets);
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Get Tickets Error: ", err.message);
    }
  }
);

// get all users
router.get("/users", userAuth, roleAuthorization("admin"), async (req, res) => {
  try {
    const allUsers = await User.find();
    if (!allUsers) {
      throw new Error("No users found");
    }
    res.status(200).json(allUsers);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
    console.log("Get Users Error: ", err.message);
  }
});

// Get all agents
router.get(
  "/agents",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const agents = await User.find({ role: "agent" }).select(
        "_id name email"
      );
      res.json(agents);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error fetching agents: " + err.message });
      console.log("Get Agents Error: ", err.message);
    }
  }
);

// Assign ticket
router.patch(
  "/ticket/:ticketId/assign",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const { assignedTo } = req.body;
      const ticket = await Ticket.findById(req.params.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      // Only Admin can assign a ticket Or reassign a ticket
      if (req.user.role != "admin") {
        throw new Error("You are not authorized to update this ticket");
      }

      ticket.assignedTo = assignedTo;
      await ticket.save();

      // Fetch updated ticket with populated fields
      const updatedTicket = await Ticket.findById(ticket._id)
        .populate("owner", "name email")
        .populate("assignedTo", "name email");
      if (updatedTicket.assignedTo?.email) {
        await sendEmail(
          updatedTicket.assignedTo.email,
          `🎫 New Ticket Assigned: ${updatedTicket.subject}`,
          `You have been assigned a new ticket: "${updatedTicket.subject}"`,
          `<p>Hello <b>${updatedTicket.assignedTo.name}</b>,</p>
           <p>You have been assigned a new ticket:</p>
           <p><strong>Subject:</strong> ${updatedTicket.subject}</p>
           <p><strong>Description:</strong> ${updatedTicket.description}</p>
           <p><strong>Priority:</strong> ${updatedTicket.priority}</p>`
        );
      }
      res.json({
        message: "Ticket assigned successfully",
        data: updatedTicket,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Assign Ticket Error: ", err.message);
    }
  }
);

// Add User
router.post("/user", userAuth, roleAuthorization("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const user = new User({
      name,
      email,
      password,
      role,
    });
    const savedUser = await user.save();
    res.json({
      message: "User created successfully",
      data: savedUser,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
    console.log("Create User Error: ", err.message);
  }
});

// Remove user
// When admin deletes a user then all tickets assigned to that user will be deleted as well all tickets created by that user will be deleted , all comments made by that user will be deleted

router.delete(
  "/users/:userId",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    console.log("DELETE /admin/users hit ✅", req.params.userId);

    try {
      console.log("DELETE /admin/users hit ✅", req.params.userId);

      const deletedUser = await User.findByIdAndDelete(req.params.userId);
      if (!deletedUser) {
        throw new Error("User not found");
      }
      // When admin deletes a user then all tickets assigned to that user will be deleted as well all tickets created by that user will be deleted , all comments made by that user will be deleted
      await Ticket.deleteMany({ assignedTo: req.params.userId });
      await Ticket.deleteMany({ owner: req.params.userId });
      await Comment.deleteMany({ user: req.params.userId });
      console.log(deletedUser);
      res.json({
        message: "User deleted successfully",
        data: deletedUser,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Delete User Error: ", err.message);
    }
  }
);

// Assign Roles
router.patch(
  "/user/:userId/role",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const { role } = req.body;
      if (!["admin", "agent", "user"].includes(role)) {
        throw new Error("Invalid role");
      }
      const user = await User.findById(req.params.userId);
      if (!user) {
        throw new Error("User not found");
      }
      user.role = role;
      const updatedUser = await user.save();
      res.json({
        message: "User role updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Update User Role Error: ", err.message);
    }
  }
);

// Force Reassign Ticket
router.patch(
  "/ticket/:ticketId/reassign",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const { assignedTo } = req.body;
      const ticket = await Ticket.findById(req.params.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      ticket.assignedTo = assignedTo;
      ticket.status = "in progress";
      const updatedTicket = await ticket.save();
      res.json({
        message: "Ticket reassigned successfully",
        data: updatedTicket,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Reassign Ticket Error: ", err.message);
    }
  }
);

// Remove Ticket
router.delete(
  "/ticket/:ticketId",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      if (req.user.role != "admin") {
        throw new Error("You are not authorized to delete this ticket");
      }
      const deletedTicket = await ticket.deleteOne();
      res.json({
        message: "Ticket deleted successfully",
        data: deletedTicket,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Delete Ticket Error: ", err.message);
    }
  }
);

// Force Close Ticket
router.patch(
  "/tickets/:ticketId/status",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      console.log("Ticket Status:", status);
      if (!["open", "in progress", "resolved", "closed"].includes(status)) {
        throw new Error("Invalid status value");
      }
      const ticket = await Ticket.findById(req.params.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      ticket.status = status;
      const updatedTicket = await ticket.save();
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

// Ticket stats
router.get(
  "/tickets/stats",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const stats = await Ticket.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
      console.log(stats);
      res.json(stats);
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
      console.log("Ticket Stats Error: ", err.message);
    }
  }
);

// Get ticket details by ID
router.get(
  "/tickets/:ticketId",
  userAuth,
  roleAuthorization("admin"),
  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.ticketId)
        .populate("owner", "name email")
        .populate("assignedTo", "name email");

      if (!ticket) throw new Error("Ticket not found");

      res.json(ticket);
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

module.exports = { adminRouter: router };
