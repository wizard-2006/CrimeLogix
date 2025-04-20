import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errormiddlewares.js";
import db from "../database/db.js"; // mysql2 connection pool
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";
import  User  from "../models/usermodel.js";
/**
 * Helper: Get a user by a given SQL query and parameters.
 */
async function getUserBy(query, params) {
  const [rows] = await db.query(query, params);
  return rows;
}

/**
 * Controller: Register a new user.
 */
export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please enter all fields.", 400));
  }

  // Check if a verified user with this email already exists.
  let users = await getUserBy(
    "SELECT * FROM users WHERE email = ? AND accountVerified = 1",
    [email]
  );
  if (users.length > 0) {
    return next(new ErrorHandler("User already exists.", 400));
  }

  // Check registration attempts for unverified accounts.
//   users = await getUserBy(
//     "SELECT * FROM users WHERE email = ? AND accountVerified = 0",
//     [email]
//   );
//   if (users.length >= 5) {
//     return next(
//       new ErrorHandler(
//         "You have exceeded the number of registration attempts. Please contact support.",
//         400
//       )
//     );
//   }

  if (password.length < 8 || password.length > 16) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  // Insert a new user record; accountVerified is 0 (false) by default.
  const [result] = await db.query(
    `INSERT INTO users (name, email, password, accountVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, 0, NOW(), NOW())
     ON DUPLICATE KEY UPDATE 
       name = VALUES(name),
       password = VALUES(password),
       updatedAt = NOW()`,
    [name, email, hashedPassword]
  );
  
  const newUserId = result.insertId;

  // Generate a random 6-digit verification code.
  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  const verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000); // expires in 10 minutes
  // console.log(verificationCodeExpire);
  // Update the new user's record with the verification code and expiry.
  await db.query(
    `UPDATE users SET verificationCode = ?, verificationCodeExpire = ? WHERE id = ?`,
    [verificationCode, verificationCodeExpire, newUserId]
  );

  // Send verification code to the user's email.
  sendVerificationCode(verificationCode, email, res);
});

/**
 * Controller: Verify OTP (One Time Password) for user account.
 */
export const verifyOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return next(new ErrorHandler("Email and OTP are required", 400));
  }

  // Modified query to get unverified user
  const [users] = await db.execute(
    "SELECT * FROM users WHERE email = ? AND accountVerified = 0",
    [email]
  );

  if (users.length === 0) {
    return next(new ErrorHandler("Invalid verification attempt", 400));
  }

  const user = users[0];

  if (Number(user.verificationCode) !== Number(otp)) {
    return next(new ErrorHandler("Invalid OTP", 400));
  }

  if (Date.now() > new Date(user.verificationCodeExpire).getTime()) {
    return next(new ErrorHandler("OTP has expired", 400));
  }

  // Update user verification status
  await db.execute(
    `UPDATE users 
     SET accountVerified = 1, 
         verificationCode = NULL, 
         verificationCodeExpire = NULL, 
         updatedAt = NOW() 
     WHERE id = ?`,
    [user.id]
  );

  // Send only success and message
  res.status(200).json({
    success: true,
    message: "Account verified successfully"
  });
});

/**
 * Controller: Log in a user.
 */
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please enter all fields.", 400));
  }

  const users = await getUserBy(
    "SELECT * FROM users WHERE email = ? AND accountVerified = 1",
    [email]
  );
  if (users.length === 0) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  const user = users[0];

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  sendToken(new User(user), 200, "User login successfully.", res);
});

/**
 * Controller: Log out a user.
 */
export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

/**
 * Controller: Get currently authenticated user.
 */
export const getUser = catchAsyncErrors(async (req, res, next) => {
  // Assuming req.user is set by an authentication middleware (using sendToken).
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * Controller: Forgot Password
 */
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.email) {
    return next(new ErrorHandler("Email is required.", 400));
  }
  const users = await getUserBy(
    "SELECT * FROM users WHERE email = ? AND accountVerified = 1",
    [req.body.email]
  );
  if (users.length === 0) {
    return next(new ErrorHandler("Invalid email.", 400));
  }
  const userInstance= users[0];
  const user= new User(userInstance);

  // Generate reset token.
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswordToken = crypto.createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

  await db.query(
    `UPDATE users SET resetPasswordToken = ?, resetPasswordExpire = ?, updatedAt = NOW() WHERE id = ?`,
    [resetPasswordToken, resetPasswordExpire, user.id]
  );

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

  try {
    await sendEmail({
      email: user.email,
      subject: "Crime Record Management System Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    // If email sending fails, clear the reset token from the database.
    await db.query(
      `UPDATE users SET resetPasswordToken = NULL, resetPasswordExpire = NULL, updatedAt = NOW() WHERE id = ?`,
      [user.id]
    );
    return next(new ErrorHandler(error.message, 500));
  }
});

/**
 * Controller: Reset Password
 */
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const users = await getUserBy(
    "SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpire > NOW()",
    [resetPasswordToken]
  );
  if (users.length === 0) {
    return next(new ErrorHandler("Reset password token is invalid or has expired.", 400));
  }
  const userInstance= users[0];
  const user= new User(userInstance);

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password and confirm password do not match.", 400));
  }
  if (req.body.password.length < 8 || req.body.password.length > 16) {
    return next(new ErrorHandler("Password must be between 8 and 16 characters.", 400));
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  await db.query(
    `UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpire = NULL, updatedAt = NOW() WHERE id = ?`,
    [hashedPassword, user.id]
  );

  // Retrieve updated user record.
  const [updatedRows] = await db.query("SELECT * FROM users WHERE id = ?", [user.id]);
  const updatedUserr = updatedRows[0];
  const updatedUser = new User(updatedUserr); 

  sendToken(updatedUser, 200, "Password reset successfully.", res);
});

/**
 * Controller: Update Password (when logged in)
 */
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  // Assuming req.user contains the authenticated user's details (with an id field).
  const [users] = await db.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (users.length === 0) {
    return next(new ErrorHandler("User not found.", 404));
  }
  const userInstance= users[0];
  const user= new User(userInstance);

  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please enter all fields.", 400));
  }

  const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Current password is incorrect.", 400));
  }

  if (newPassword !== confirmNewPassword) {
    return next(new ErrorHandler("New password and confirm new password do not match.", 400));
  }
  if (newPassword.length < 8 || newPassword.length > 16) {
    return next(new ErrorHandler("Password must be between 8 and 16 characters.", 400));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.query("UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?", [hashedPassword, user.id]);

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});
