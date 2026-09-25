const { getPool } = require("../../config/db");
const generateToken = require("../../utils/generateToken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateSignedUrl, uploadFileToS3 } = require("../../utils/s3");

const register = async (req, res) => {
  const { email, role_id, password, company = "" } = req.body;
  const pool = getPool();
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ status: "fail", message: "User already exists", status_code: 400, data: {} });

    const roleName = role_id === "admin" ? "admin" : "user";
    const [roles] = await pool.query("SELECT id FROM roles WHERE name = ?", [roleName]);
    if (roles.length === 0) return res.status(400).json({ status: "fail", message: "Role not found, make sure roles exist.", status_code: 400, data: {} });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = crypto.randomBytes(8).toString("hex");

    const [result] = await pool.query(
      "INSERT INTO users (email, password, role_id, user_id, company, status) VALUES (?, ?, ?, ?, ?, 'active')",
      [email, hashedPassword, roles[0].id, user_id, company]
    );

    const user = { id: result.insertId, email, role_id: roles[0].id, user_id };
    res.status(201).json({ status: "success", message: "User registered successfully", status_code: 201, data: { user, token: generateToken(user) } });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "Registration error: " + err.message, status_code: 500, data: {} });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const pool = getPool();
  try {
    const [users] = await pool.query(
      "SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = ?",
      [email]
    );

    if (users.length === 0) return res.status(404).json({ status: "fail", message: "User Not Found!", status_code: 404, data: {} });

    const user = users[0];

    if (user.status && user.status.toLowerCase() === "inactive")
      return res.status(403).json({ status: "fail", message: "Your account is inactive. Please contact admin.", status_code: 403, data: {} });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ status: "fail", message: "Invalid credentials", status_code: 401, data: {} });

    delete user.password;
    user.image = user.image ? generateSignedUrl(user.image) : null;

    res.status(200).json({ status: "success", message: "Login successful", status_code: 200, data: { user, token: generateToken(user) } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ status: "fail", message: "Login error: " + err.message, status_code: 500, data: {} });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const pool = getPool();
  try {
    const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ status: "fail", message: "Email not found", status_code: 404, data: {} });

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query("INSERT INTO password_reset_tokens (email, token, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE token = ?, created_at = NOW()", [email, token, token]);

    const resetLink = `${process.env.URL}/reset-password?token=${token}`;
    const transporter = nodemailer.createTransport({ service: "Gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });

    await transporter.sendMail({ to: email, subject: "Reset your password", html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>` });

    return res.status(200).json({ status: "success", message: "Reset password link sent to your email.", status_code: 200, data: {} });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ status: "fail", message: "Error sending email: " + err.message, status_code: 500, data: {} });
  }
};

const resetPassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const token = req.query.token;
  const pool = getPool();

  if (!token) return res.status(400).json({ status: "fail", message: "Token is required in URL", status_code: 400, data: {} });
  if (password !== confirmPassword) return res.status(400).json({ status: "fail", message: "Passwords do not match", status_code: 400, data: {} });

  try {
    const [tokens] = await pool.query("SELECT id FROM password_reset_tokens WHERE email = ? AND token = ?", [email, token]);
    if (tokens.length === 0) return res.status(400).json({ status: "fail", message: "Invalid or expired token", status_code: 400, data: {} });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    await pool.query("DELETE FROM password_reset_tokens WHERE email = ?", [email]);

    return res.status(200).json({ status: "success", message: "Password reset successfully", status_code: 200, data: {} });
  } catch (err) {
    return res.status(500).json({ status: "fail", message: "Error resetting password: " + err.message, status_code: 500, data: {} });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ status: "fail", message: "User not found", status_code: 404, data: {} });

    const userData = { ...user, image: user.image ? generateSignedUrl(user.image) : null };
    delete userData.password;

    return res.status(200).json({ status: "success", message: "User details fetched successfully", status_code: 200, data: userData });
  } catch (err) {
    return res.status(500).json({ status: "fail", message: "Error fetching user details: " + err.message, status_code: 500, data: {} });
  }
};

const updateUserProfile = async (req, res) => {
  const pool = getPool();
  try {
    const userId = req.user.id;
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ status: "fail", message: "User not found", status_code: 404, data: {} });

    const user = users[0];
    const roleName = req.user.role_name;

    if (roleName !== "admin" && roleName !== "manager") {
      if ("role_id" in req.body) return res.status(403).json({ status: "fail", message: "You are not allowed to update your role", status_code: 403, data: {} });
      if ("status" in req.body) return res.status(403).json({ status: "fail", message: "You are not allowed to update your account status", status_code: 403, data: {} });
      if ("company" in req.body || "department" in req.body || "center_cost" in req.body)
        return res.status(403).json({ status: "fail", message: "You are not allowed to update company information", status_code: 403, data: {} });
    }

    const { first_name, last_name, phone_number, company, department, center_cost, address, role_id, status, current_password, new_password, confirm_password } = req.body;

    if (current_password || new_password || confirm_password) {
      if (!current_password || !new_password || !confirm_password)
        return res.status(400).json({ status: "fail", message: "All password fields are required", status_code: 400, data: {} });
      if (!(await bcrypt.compare(current_password, user.password)))
        return res.status(400).json({ status: "fail", message: "Current password is incorrect", status_code: 400, data: {} });
      if (current_password === new_password)
        return res.status(400).json({ status: "fail", message: "New password must be different from current password", status_code: 400, data: {} });
      if (new_password !== confirm_password)
        return res.status(400).json({ status: "fail", message: "New password and confirm password do not match", status_code: 400, data: {} });
      await pool.query("UPDATE users SET password = ? WHERE id = ?", [await bcrypt.hash(new_password, 10), userId]);
    }

    let imageKey = user.image;
    if (req.file) {
      const s3Response = await uploadFileToS3(req.file.buffer, req.file.originalname, "uploads/profile", req.file.mimetype);
      imageKey = s3Response.Key;
    }

    await pool.query(
      "UPDATE users SET first_name=?, last_name=?, phone_number=?, company=?, department=?, center_cost=?, address=?, role_id=?, status=?, image=? WHERE id=?",
      [first_name || user.first_name, last_name || user.last_name, phone_number || user.phone_number,
       company || user.company, department || user.department, center_cost || user.center_cost,
       address || user.address, role_id || user.role_id, status || user.status, imageKey, userId]
    );

    const [updated] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    const updatedUser = updated[0];
    delete updatedUser.password;
    if (updatedUser.image) updatedUser.image = generateSignedUrl(updatedUser.image);

    res.status(200).json({ status: "success", message: "Profile updated successfully", status_code: 200, data: updatedUser });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "Error updating profile: " + err.message, status_code: 500, data: {} });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, getUserDetails, updateUserProfile };
