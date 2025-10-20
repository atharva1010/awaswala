// routes/roomRoutes.js
const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const authMiddleware = require("../middleware/auth"); // JWT se email le aayega

// Get all rooms uploaded by logged-in user
router.get("/my-rooms", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user.email }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching rooms" });
  }
});

module.exports = router;
