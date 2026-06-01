import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  findOrCreateConversation,
  getConversations,
} from "../controllers/conversationController.js";

const router = express.Router();

// Create or get existing conversation
router.post("/", authMiddleware, findOrCreateConversation);

// Get all conversations for current user
router.get("/", authMiddleware, getConversations);

export default router;
