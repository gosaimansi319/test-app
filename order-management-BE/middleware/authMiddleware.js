const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ status: "fail", status_code: 401, message: "No token provided", data: {} });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = getPool();
    const [users] = await pool.query(
      "SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?",
      [decoded.id]
    );

    if (users.length === 0)
      return res.status(404).json({ status: "fail", status_code: 404, message: "User not found", data: {} });

    const user = users[0];
    if (user.status === 'inactive')
      return res.status(403).json({ status: "fail", message: "Your account is inactive. Please contact admin.", status_code: 403, data: {} });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ status: "fail", status_code: 401, message: "Invalid or expired token", data: {} });
  }
};

module.exports = authMiddleware;
