import express from "express";
import {
  createWitness,
  getAllWitnesses,
  getWitness,
  updateWitness,
  deleteWitness
} from "../controllers/witnesscontroller.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (no authorization required)
router.route("/")
  .get(getAllWitnesses);

router.route("/:id")
  .get(getWitness);

// Protected routes (require officer authorization)
router.route("/")
  .post(isAuthenticated, isAuthorized("officer","admin"), createWitness);

router.route("/:id")
  .put(isAuthenticated, isAuthorized("officer","admin"), updateWitness)
  .delete(isAuthenticated, isAuthorized("officer","admin"), deleteWitness);

export default router;