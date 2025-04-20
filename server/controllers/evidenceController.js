import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errormiddlewares.js";
import Evidence from "../models/evidencemodel.js";

export const getAllEvidence = catchAsyncErrors(async (req, res, next) => {
  const evidence = await Evidence.findAll();
  res.status(200).json({
    success: true,
    evidence
  });
});

export const getEvidence = catchAsyncErrors(async (req, res, next) => {
  const evidence = await Evidence.findById(req.params.id);
  
  if (!evidence) {
    return next(new ErrorHandler("Evidence not found", 404));
  }

  res.status(200).json({
    success: true,
    evidence
  });
});

export const createEvidence = catchAsyncErrors(async (req, res, next) => {
  const evidence = await Evidence.create(req.body);
  
  res.status(201).json({
    success: true,
    evidence
  });
});

export const updateEvidence = catchAsyncErrors(async (req, res, next) => {
  let evidence = await Evidence.findById(req.params.id);
  
  if (!evidence) {
    return next(new ErrorHandler("Evidence not found", 404));
  }

  Object.assign(evidence, req.body);
  await evidence.save();

  res.status(200).json({
    success: true,
    evidence
  });
});

export const deleteEvidence = catchAsyncErrors(async (req, res, next) => {
  const evidence = await Evidence.findById(req.params.id);
  
  if (!evidence) {
    return next(new ErrorHandler("Evidence not found", 404));
  }

  await Evidence.deleteById(req.params.id);

  res.status(200).json({
    success: true,
    message: "Evidence deleted successfully"
  });
});