import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errormiddlewares.js";
import Victim from "../models/victimmodel.js";

// Create new victim
export const createVictim = catchAsyncErrors(async (req, res, next) => {
  const victim = await Victim.create(req.body);
  
  res.status(201).json({
    success: true,
    victim
  });
});

// Get all victims
export const getAllVictims = catchAsyncErrors(async (req, res, next) => {
  const victims = await Victim.findAll();
  
  res.status(200).json({
    success: true,
    victims
  });
});

// Get single victim
export const getVictim = catchAsyncErrors(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);
  
  if (!victim) {
    return next(new ErrorHandler("Victim not found", 404));
  }

  res.status(200).json({
    success: true,
    victim
  });
});

// Update victim
export const updateVictim = catchAsyncErrors(async (req, res, next) => {
  let victim = await Victim.findById(req.params.id);
  
  if (!victim) {
    return next(new ErrorHandler("Victim not found", 404));
  }

  // Update fields
  Object.assign(victim, req.body);
  await victim.save();

  res.status(200).json({
    success: true,
    victim
  });
});

// Delete victim
export const deleteVictim = catchAsyncErrors(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);
  
  if (!victim) {
    return next(new ErrorHandler("Victim not found", 404));
  }

  await Victim.deleteById(req.params.id);

  res.status(200).json({
    success: true,
    message: "Victim deleted successfully"
  });
});