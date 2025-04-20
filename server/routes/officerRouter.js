import express from "express";
import {
  createOfficer,
  getAllOfficers,
  getOfficer,
  updateOfficer,
  deleteOfficer
} from "../controllers/officerController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (no authorization required)
router.route("/")
  .get(getAllOfficers);

router.route("/:id")
  .get(getOfficer);

// Protected routes (require admin authorization)
router.route("/")
  .post(isAuthenticated, isAuthorized("admin"), createOfficer);

router.route("/:id")
  .put(isAuthenticated, isAuthorized("admin"), updateOfficer)
  .delete(isAuthenticated, isAuthorized("admin"), deleteOfficer);

export default router;