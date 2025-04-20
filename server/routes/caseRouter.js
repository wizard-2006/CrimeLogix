import express from "express";
import {
  createCase,
  getAllCases,
  getCase,
  updateCaseStatus,
  updateCasePriority,
  assignOfficer,
  deleteCase
} from "../controllers/caseController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.route("/")
  .get(getAllCases);

router.route("/:id")
  .get(getCase);

// Protected routes - admin only
router.route("/")
  .post(isAuthenticated, createCase);

router.route("/:id/status")
  .put(isAuthenticated, isAuthorized("admin"), updateCaseStatus);

router.route("/:id/priority")
  .put(isAuthenticated, isAuthorized("admin"), updateCasePriority);

router.route("/:id/assign")
  .put(isAuthenticated, isAuthorized("admin"), assignOfficer);

router.route("/:id")
  .delete(isAuthenticated, isAuthorized("admin"), deleteCase);

export default router;