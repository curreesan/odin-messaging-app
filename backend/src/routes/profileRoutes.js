import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createProfile,
  getMyProfile,
  updateProfile,
} from "../controllers/profileController.js";

const router = express.Router();

// POST /api/profiles
router.post("/", authMiddleware, createProfile);

// GET /api/profiles/me
router.get("/me", authMiddleware, getMyProfile);

// PUT /api/profiles/me
router.put("/me", authMiddleware, updateProfile);

export default router;
