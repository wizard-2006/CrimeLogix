import express from "express";
import {
  createSuspect,
  getAllSuspects,
  getSuspect,
  updateSuspect,
  deleteSuspect
} from "../controllers/suspectController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(getAllSuspects).post(isAuthenticated, createSuspect);
router.route("/:id")
  .get(getSuspect)
  .put(isAuthenticated,isAuthorized("admin", "officer"),updateSuspect)
  .delete(isAuthenticated,isAuthorized("admin", "officer"), deleteSuspect);

export default router;