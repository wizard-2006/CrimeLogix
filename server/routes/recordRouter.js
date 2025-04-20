import express from "express";
import {
  createCompleteRecord,
  getAllRecords,
  getPendingRecords,
  approveRecord,
  rejectRecord,
  getRecordStats,
  getRecord,          
  updateRecord,       
  deleteRecord  
} from "../controllers/recordController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { validateRecordInput } from "../middlewares/validateInput.js";

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Admin approval routes
router.get("/pending", isAuthorized("admin"), getPendingRecords);
router.put("/:id/approve", isAuthorized("admin"), approveRecord);
router.put("/:id/reject", isAuthorized("admin"), rejectRecord);

//manual insertion
// router.post("/manual", isAuthenticated, recordController.insertRecordManually);

// Statistics route
router.get("/stats", isAuthorized("admin"), getRecordStats);

// Basic record operations
router.route("/")
  .get(getAllRecords)
  .post(isAuthorized("admin", "officer"), validateRecordInput, createCompleteRecord);

router.route("/:id")
  .get(getRecord)
  .put(isAuthorized("admin", "officer"), validateRecordInput, updateRecord)
  .delete(isAuthorized("admin"), deleteRecord);



export default router;