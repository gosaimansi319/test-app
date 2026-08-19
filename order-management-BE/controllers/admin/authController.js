const PasswordResetToken = require("../../models/PasswordResetToken");
const Role = require("../../models/Role");
const User = require("../../models/User");
const generateToken = require("../../utils/generateToken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateSignedUrl, uploadFileToS3 } = require("../../utils/s3");

const register = async (req, res) => {
  const { email, role_id } = req.body;

  try {
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        status: "fail",
        message: "User already exists",
        status_code: 400,
        data: {},
      });
    }

    let role;

    if (role_id === "admin") {
      role = await Role.findOne({ name: "admin" });
    } else {
      role = await Role.findOne({ name: "user" });
    }

    if (!role) {
      return res.status(400).json({
        status: "fail",
        message: "Role not found, make sure roles exist.",
        status_code: 400,
        data: {},
      });
    }

    const user = new User({
      ...req.body,
      role_id: role,
    });

    await user.save();

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      status_code: 201,
      data: {
        user,
        token: generateToken(user),
      },
    });

  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Registration error: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email })
      .populate("role_id", "name");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User Not Found!",
        status_code: 404,
        data: {},
      });
    }

    if (
      user.status &&
      user.status.toLowerCase() === "inactive"
    ) {
      return res.status(403).json({
        status: "fail",
        message: "Your account is inactive. Please contact admin.",
        status_code: 403,
        data: {},
      });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials",
        status_code: 401,
        data: {},
      });
    }

    const userObj = user.toJSON();

    userObj.image = user.image
      ? generateSignedUrl(user.image)
      : null;

    userObj.role_name = user.role_id.name;

    res.status(200).json({
      status: "success",
      message: "Login successful",
      status_code: 200,
      data: {
        user: userObj,
        token: generateToken(user),
      },
    });

  } catch (err) {

    // 👇 ADDED: Show actual login error in Docker logs
    console.error("Login error:", err);

    return res.status(500).json({
      status: "fail",
      message: "Login error: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Email not found",
        status_code: 404,
        data: {},
      });
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    await PasswordResetToken.findOneAndUpdate(
      { email },
      {
        token,
        createdAt: Date.now(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    const resetLink =
      `${process.env.MAIL_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="text-align: center; color: #333;">
          Password Reset Request
        </h2>

        <p>Hello,</p>

        <p>
          You have requested a password reset.
          Click the button below to reset your password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a
            href="${resetLink}"
            style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;"
          >
            Reset Password
          </a>
        </div>

        <p>
          If you did not request a password reset,
          please ignore this email.
        </p>
      </div>
    `;

    await transporter.sendMail({
      to: email,
      subject: "Reset your password",
      html: emailTemplate,
    });

    return res.status(200).json({
      status: "success",
      message: "Reset password link sent to your email.",
      status_code: 200,
      data: {},
    });

  } catch (err) {

    // 👇 ADDED: Show actual forgot-password error in Docker logs
    console.error("Forgot password error:", err);

    return res.status(500).json({
      status: "fail",
      message: "Error sending email: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};


const resetPassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({
      status: "fail",
      message: "Token is required in URL",
      status_code: 400,
      data: {},
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      status: "fail",
      message: "Passwords do not match",
      status_code: 400,
      data: {},
    });
  }

  try {
    const resetToken =
      await PasswordResetToken.findOne({ email, token });

    if (!resetToken) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid or expired token",
        status_code: 400,
        data: {},
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: {},
      });
    }

    user.password = password;

    await user.save();

    await PasswordResetToken.deleteOne({ email });

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully",
      status_code: 200,
      data: {},
    });

  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "Error resetting password: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};


const getUserDetails = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: {},
      });
    }

    const imageUrl = user.image
      ? generateSignedUrl(user.image)
      : null;

    const userData = {
      _id: user._id,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      email: user.email,
      image: imageUrl,
      phone_number: user.phone_number || null,
      company: user.company,
      department: user.department || null,
      center_cost: user.center_cost || null,
      role_id: user.role_id,
      address: user.address || null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: {},
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User details fetched successfully",
      status_code: 200,
      data: userData,
    });

  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "Error fetching user details: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: {},
      });
    }

    // User are not allowed to update this
    // role_id, status, company, department, center_cost fields
    if (
      req.user.role_id.name !== "admin" &&
      req.user.role_id.name !== "manager"
    ) {

      if ("role_id" in req.body) {
        return res.status(403).json({
          status: "fail",
          message: "You are not allowed to update your role",
          status_code: 403,
          data: {},
        });
      }

      if ("status" in req.body) {
        return res.status(403).json({
          status: "fail",
          message: "You are not allowed to update your account status",
          status_code: 403,
          data: {},
        });
      }

      if (
        "company" in req.body ||
        "department" in req.body ||
        "center_cost" in req.body
      ) {
        return res.status(403).json({
          status: "fail",
          message: "You are not allowed to update company information",
          status_code: 403,
          data: {},
        });
      }
    }

    const {
      first_name,
      last_name,
      phone_number,
      company,
      department,
      center_cost,
      address,
      role_id,
      status,
      current_password,
      new_password,
      confirm_password,
    } = req.body;

    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.phone_number =
      phone_number || user.phone_number;
    user.company = company || user.company;
    user.department =
      department || user.department;
    user.center_cost =
      center_cost || user.center_cost;
    user.address = address || user.address;
    user.role_id = role_id || user.role_id;
    user.status = status || user.status;

    // Password update flow
    if (
      current_password ||
      new_password ||
      confirm_password
    ) {

      if (
        !current_password ||
        !new_password ||
        !confirm_password
      ) {
        return res.status(400).json({
          status: "fail",
          message: "All password fields are required",
          status_code: 400,
          data: {},
        });
      }

      const isMatch =
        await user.matchPassword(current_password);

      if (!isMatch) {
        return res.status(400).json({
          status: "fail",
          message: "Current password is incorrect",
          status_code: 400,
          data: {},
        });
      }

      if (current_password === new_password) {
        return res.status(400).json({
          status: "fail",
          message:
            "New password must be different from current password",
          status_code: 400,
          data: {},
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          status: "fail",
          message:
            "New password and confirm password do not match",
          status_code: 400,
          data: {},
        });
      }

      user.password = new_password;
    }

    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;

      const s3Response = await uploadFileToS3(
        fileBuffer,
        fileName,
        "uploads/profile",
        req.file.mimetype
      );

      // Save only the S3 key
      user.image = s3Response.Key;
    }

    await user.save();

    const role = await Role.findById(user.role_id);

    const userObj = user.toJSON();

    if (userObj.image) {
      userObj.image =
        generateSignedUrl(userObj.image);
    }

    if (role) {
      userObj.role = role;
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      status_code: 200,
      data: userObj,
    });

  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error updating profile: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};


module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updateUserProfile,
};