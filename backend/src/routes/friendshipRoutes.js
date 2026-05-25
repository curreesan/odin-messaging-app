import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  sendFriendRequest,
  getIncomingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  unfriend,
} from "../controllers/friendshipController.js";

const router = express.Router();

// ---------------- CREATE ----------------
// Send friend request
router.post("/", authMiddleware, sendFriendRequest);

// ---------------- READ ----------------
// Incoming friend requests
router.get("/requests", authMiddleware, getIncomingRequests);

// Sent friend requests
router.get("/sent", authMiddleware, getSentRequests);

// Friends list
router.get("/", authMiddleware, getFriends);

// ---------------- UPDATE ----------------
// Accept request
router.put("/:id/accept", authMiddleware, acceptFriendRequest);

// ---------------- DELETE ----------------
// Reject friend request (receiver only)
router.delete("/:id/reject", authMiddleware, rejectFriendRequest);

// Unfriend (either user can delete)
router.delete("/:id", authMiddleware, unfriend);

export default router;
