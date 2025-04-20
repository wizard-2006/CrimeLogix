import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../database/db.js'; // MySQL2 connection pool

class User {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.password = user.password;
    this.role = user.role || 'User';
    this.accountVerified = user.accountVerified || false;
    this.avatarPublicId = user.avatarPublicId || null;
    this.avatarUrl = user.avatarUrl || null;
    this.verificationCode = user.verificationCode || null;
    this.verificationCodeExpire = user.verificationCodeExpire || null;
    this.resetPasswordToken = user.resetPasswordToken || null;
    this.resetPasswordExpire = user.resetPasswordExpire || null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  // Instance Methods

  generateVerificationCode() {
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    const remainingDigits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const verificationCode = parseInt(`${firstDigit}${remainingDigits}`);
    this.verificationCode = verificationCode;
    // Store the expire time as a timestamp (or Date if you prefer)
    this.verificationCodeExpire = Date.now() + 15 * 60 * 1000;
    return verificationCode;
  }

  generateToken() {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRE,
    });
  }

  getResetPasswordToken() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
  }

  // Save changes for an existing user instance
  async save() {
    const sql = `
      UPDATE users
      SET name = ?, email = ?, password = ?, role = ?, accountVerified = ?,
          avatarPublicId = ?, avatarUrl = ?, verificationCode = ?, verificationCodeExpire = ?,
          resetPasswordToken = ?, resetPasswordExpire = ?, updatedAt = NOW()
      WHERE id = ?`;

    await db.execute(sql, [
      this.name,
      this.email,
      this.password,
      this.role,
      this.accountVerified,
      this.avatarPublicId,
      this.avatarUrl,
      this.verificationCode,
      this.verificationCodeExpire,
      this.resetPasswordToken,
      this.resetPasswordExpire,
      this.id,
    ]);
  }

  // Static methods for operations like create and find

  // Create a new user and return its instance
  static async create(userObj) {
    const sql = `
      INSERT INTO users (name, email, password, role, accountVerified, avatarPublicId, avatarUrl, verificationCode, verificationCodeExpire, resetPasswordToken, resetPasswordExpire, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    const [result] = await db.execute(sql, [
      userObj.name,
      userObj.email,
      userObj.password,
      userObj.role || 'User',
      userObj.accountVerified || false,
      userObj.avatarPublicId || null,
      userObj.avatarUrl || null,
      userObj.verificationCode || null,
      userObj.verificationCodeExpire || null,
      userObj.resetPasswordToken || null,
      userObj.resetPasswordExpire || null,
    ]);
    // Retrieve the created user from DB
    return await User.findById(result.insertId);
  }

  // Find a user by their id and return an instance, or null if not found
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  // Find a user by email
  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  // Delete a user by id
  static async deleteById(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    await db.execute(sql, [id]);
  }
}

export default User;

