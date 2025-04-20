import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errormiddlewares.js";
import Witness from "../models/witnessmodel.js";

export const createWitness = catchAsyncErrors(async (req, res, next) => {
  const witness = await Witness.create(req.body);
  
  res.status(201).json({
    success: true,
    witness
  });   
});

export const getAllWitnesses = catchAsyncErrors(async (req, res, next) => {
  const witnesses = await Witness.findAll();
  
  res.status(200).json({
    success: true,
    witnesses
  });
});

export const getWitness = catchAsyncErrors(async (req, res, next) => {
  const witness = await Witness.findById(req.params.id);
  
  if (!witness) {
    return next(new ErrorHandler("Witness not found", 404));
  }

  res.status(200).json({
    success: true,
    witness
  });
});

export const updateWitness = catchAsyncErrors(async (req, res, next) => {
  let witness = await Witness.findById(req.params.id);
  
  if (!witness) {
    return next(new ErrorHandler("Witness not found", 404));
  }

  Object.assign(witness, req.body);
  await witness.save();

  res.status(200).json({
    success: true,
    witness
  });
});

export const deleteWitness = catchAsyncErrors(async (req, res, next) => {
  const witness = await Witness.findById(req.params.id);
  
  if (!witness) {
    return next(new ErrorHandler("Witness not found", 404));
  }

  await Witness.deleteById(req.params.id);

  res.status(200).json({
    success: true,
    message: "Witness deleted successfully"
  });
});