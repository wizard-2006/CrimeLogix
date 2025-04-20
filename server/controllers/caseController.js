import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errormiddlewares.js";
import Case from "../models/casemodel.js";

export const getAllCases = catchAsyncErrors(async (req, res) => {
  const cases = await Case.findAll();
  res.status(200).json({ success: true, cases });
});

export const getCase = catchAsyncErrors(async (req, res, next) => {
  const case_ = await Case.findById(req.params.id);
  if (!case_) {
    return next(new ErrorHandler("Case not found", 404));
  }
  res.status(200).json({ success: true, case: case_ });
});

export const createCase = catchAsyncErrors(async (req, res) => {
  const case_ = await Case.create(req.body);
  res.status(201).json({ success: true, case: case_ });
});

export const updateCaseStatus = catchAsyncErrors(async (req, res, next) => {
  let case_ = await Case.findById(req.params.id);
  if (!case_) {
    return next(new ErrorHandler("Case not found", 404));
  }
  case_.status = req.body.status;
  await case_.save();
  res.status(200).json({ success: true, case: case_ });
});

export const updateCasePriority = catchAsyncErrors(async (req, res, next) => {
  let case_ = await Case.findById(req.params.id);
  if (!case_) {
    return next(new ErrorHandler("Case not found", 404));
  }
  case_.priority = req.body.priority;
  await case_.save();
  res.status(200).json({ success: true, case: case_ });
});

export const assignOfficer = catchAsyncErrors(async (req, res, next) => {
  let case_ = await Case.findById(req.params.id);
  if (!case_) {
    return next(new ErrorHandler("Case not found", 404));
  }
  case_.assignedTo = req.body.officerId;
  await case_.save();
  res.status(200).json({ success: true, case: case_ });
});

export const deleteCase = catchAsyncErrors(async (req, res, next) => {
  const case_ = await Case.findById(req.params.id);
  if (!case_) {
    return next(new ErrorHandler("Case not found", 404));
  }
  await Case.deleteById(req.params.id);
  res.status(200).json({ success: true, message: "Case deleted successfully" });
});