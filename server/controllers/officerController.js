import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errormiddlewares.js";
import Officer from "../models/officermodel.js";

export const createOfficer = catchAsyncErrors(async (req, res, next) => {
  const officer = await Officer.create(req.body);
  
  res.status(201).json({
    success: true,
    officer
  });
});

export const getAllOfficers = catchAsyncErrors(async (req, res, next) => {
  const officers = await Officer.findAll();
  
  res.status(200).json({
    success: true,
    officers
  });
});

export const getOfficer = catchAsyncErrors(async (req, res, next) => {
  const officer = await Officer.findById(req.params.id);
  
  if (!officer) {
    return next(new ErrorHandler("Officer not found", 404));
  }

  res.status(200).json({
    success: true,
    officer
  });
});

export const updateOfficer = catchAsyncErrors(async (req, res, next) => {
  let officer = await Officer.findById(req.params.id);
  
  if (!officer) {
    return next(new ErrorHandler("Officer not found", 404));
  }

  Object.assign(officer, req.body);
  await officer.save();

  res.status(200).json({
    success: true,
    officer
  });
});

export const deleteOfficer = catchAsyncErrors(async (req, res, next) => {
  const officer = await Officer.findById(req.params.id);
  
  if (!officer) {
    return next(new ErrorHandler("Officer not found", 404));
  }

  await Officer.deleteById(req.params.id);

  res.status(200).json({
    success: true,
    message: "Officer deleted successfully"
  });
});