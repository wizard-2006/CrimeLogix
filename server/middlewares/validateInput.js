import ErrorHandler from "./errormiddlewares.js";

export const validateRecordInput = (req, res, next) => {
  const { caseDetails, officerId } = req.body;

  const errors = [];

  if (!caseDetails) {
    errors.push("Case details are required");
  } else {
    if (!caseDetails.incidentType) errors.push("Incident type is required");
    if (!caseDetails.dateTime) errors.push("Date and time are required");
    if (!caseDetails.location) errors.push("Location is required");
  }

  if (!officerId) errors.push("Officer ID is required");

  if (errors.length > 0) {
    return next(new ErrorHandler(errors.join(", "), 400));
  }

  next();
};