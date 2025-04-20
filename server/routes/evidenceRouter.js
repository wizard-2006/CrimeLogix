import express from "express";
import {
  createEvidence,
  getAllEvidence,
  getEvidence,
  updateEvidence,
  deleteEvidence
} from "../controllers/evidenceController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (no authorization required)
router.route("/")
  .get(getAllEvidence);

router.route("/:id")
  .get(getEvidence);

// Protected routes (require officer authorization)
router.route("/")
  .post(isAuthenticated, createEvidence);

router.route("/:id")
  .put(isAuthenticated, isAuthorized("officer","admin"), updateEvidence)
  .delete(isAuthenticated, isAuthorized("officer","admin"), deleteEvidence);

export default router;