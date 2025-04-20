import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errormiddlewares.js";
import jwt from "jsonwebtoken";
import db from "../database/db.js"; // MySQL connection pool

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [decoded.id]);

  if (rows.length === 0) {
    return next(new ErrorHandler("User not found.", 404));
  }

  req.user = rows[0]; // Store user data in request object
  next();
});

export const isAuthorized= (...roles)=>{
  return (req,res,next)=>{
    if(!roles.includes(req.user.role)){
       return next(new ErrorHandler(`User with this role (${req.user.role}) is not allowed to access this resource.`,400));
    }
    next();
  };
};
