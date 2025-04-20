import express from "express";
import {
  createVictim,
  getAllVictims,
  getVictim,
  updateVictim,
  deleteVictim
} from "../controllers/victimController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getAllVictims)
  .post(isAuthenticated, createVictim);

router.route("/:id")
  .get(getVictim)
  .put(isAuthenticated, isAuthorized("admin", "officer"), updateVictim)
  .delete(isAuthenticated, isAuthorized("admin", "officer"), deleteVictim);

export default router;