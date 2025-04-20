import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errormiddlewares.js";
import Suspect from "../models/suspectmodel.js";

export const createSuspect = catchAsyncErrors(async (req, res, next) => {
  const suspect = await Suspect.create(req.body);
  
  res.status(201).json({
    success: true,
    suspect
  });
});

export const getAllSuspects = catchAsyncErrors(async (req, res, next) => {
  const suspects = await Suspect.findAll();
  
  res.status(200).json({
    success: true,
    suspects
  });
});

export const getSuspect = catchAsyncErrors(async (req, res, next) => {
  const suspect = await Suspect.findById(req.params.id);
  
  if (!suspect) {
    return next(new ErrorHandler("Suspect not found", 404));
  }

  res.status(200).json({
    success: true,
    suspect
  });
});

export const updateSuspect = catchAsyncErrors(async (req, res, next) => {
  let suspect = await Suspect.findById(req.params.id);
  
  if (!suspect) {
    return next(new ErrorHandler("Suspect not found", 404));
  }

  Object.assign(suspect, req.body);
  await suspect.save();

  res.status(200).json({
    success: true,
    suspect
  });
});

export const deleteSuspect = catchAsyncErrors(async (req, res, next) => {
  const suspect = await Suspect.findById(req.params.id);
  
  if (!suspect) {
    return next(new ErrorHandler("Suspect not found", 404));
  }

  await Suspect.deleteById(req.params.id);

  res.status(200).json({
    success: true,
    message: "Suspect deleted successfully"
  });
});