import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import { getMessages } from "../controllers/messageController.js";

const router = express.Router();

// Get all messages in a conversation
router.get("/:conversationId", authMiddleware, getMessages);

export default router;
