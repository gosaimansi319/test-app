const User = require("../../models/User"); // Adjust path if needed
const Role = require("../../models/Role");
const Order = require("../../models/Order");
const { uploadFileToS3, generateSignedUrl } = require("../../utils/s3");

// Create a User
const createUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone_number,
      company,
      department,
      center_cost,
      address,
      role_id,
      status = "active",
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already exists',
        status_code: 400,
        data: {},
      });
    }

    let imageKey = null;

    if (req.file) {
      const s3Result = await uploadFileToS3(req.file.buffer, req.file.originalname, 'uploads/profile', req.file.mimetype);
      imageKey = s3Result.Key;
    }

    const creatorId = req.user._id;
    const role = await Role.findById(role_id);
    if (!role) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid role_id: Role does not exist',
        status_code: 400,
        data: {},
      });
    }

    const today = new Date();
    const datePart = `${String(today.getDate()).padStart(2, '0')}${String(
      today.getMonth() + 1,
    ).padStart(2, '0')}${String(today.getFullYear()).slice(-2)}`;
    const uniqueCode = Math.floor(10000 + Math.random() * 90000);
    const centerCode = Math.floor(100 + Math.random() * 900);
    const user_id = `OD-${datePart}-${centerCode}-${uniqueCode}`;

    const newUser = new User({
      first_name,
      last_name,
      email,
      password,
      image: imageKey,
      phone_number,
      company,
      department,
      center_cost,
      address,
      role_id,
      created_by: creatorId,
      user_id,
      status,
    });

    await newUser.save();

    const creator = await User.findById(creatorId).populate('role_id');
    if (creator?.role_id) {
      await Role.findByIdAndUpdate(creator.role_id._id, {
        $inc: { total_users: 1 },
      });
    }

    const userObj = newUser.toJSON();
    userObj.image = newUser.image ? generateSignedUrl(newUser.image) : null;

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: userObj,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'fail',
      message: 'Error creating user: ' + err.message,
    });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { name, email, status, role_name } = req.query;
    const filters = {};

    const loggedInUserId = req.user?._id;
    if (loggedInUserId) {
      filters._id = { $ne: loggedInUserId };
    }

    if (email) {
      filters.email = { $regex: email, $options: 'i' };
    }

    if (status) {
      filters.status = status;
    }

    let users = await User.find(filters)
      .sort({ createdAt: -1 })
      .populate("created_by", "first_name last_name")
      .populate("role_id");

    if (name) {
      const nameLower = name.trim().toLowerCase();
      users = users.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return (
          user.first_name?.toLowerCase().includes(nameLower) ||
          user.last_name?.toLowerCase().includes(nameLower) ||
          fullName.includes(nameLower)
        );
      });
    }
    
    if (role_name) {
      users = users.filter(user => 
        user.role_id?.name?.toLowerCase() === role_name.toLowerCase()
      );
    }

    const totalUsers = users.length;
    const paginatedUsers = users.slice(skip, skip + limit);

    const usersWithDetails = await Promise.all(
      paginatedUsers.map(async (user) => {
        const userObj = user.toJSON();

        if (userObj.image) {
          const signedUrl = generateSignedUrl(userObj.image);
          
          userObj.image = signedUrl;
        } else {
          userObj.image = null;
        }

        if (userObj.created_by) {
          userObj.created_by_name = `${userObj.created_by.first_name || ""} ${userObj.created_by.last_name || ""}`.trim();
        }

        return userObj;
      })
    );

    res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      status_code: 200,
      data: {
        users: usersWithDetails,
        pagination: {
          page,
          limit,
          total_pages: Math.ceil(totalUsers / limit),
          total_items: totalUsers,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching users: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Get Single User by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('created_by', 'first_name last_name').select("-password");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: {},
      });
    }

    const userObj = user.toJSON();
    if (userObj.image) {
      if (userObj.image.startsWith("http")) {
        userObj.image = userObj.image;
      } else {
        userObj.image = generateSignedUrl(userObj.image);
      }
    } else {
      userObj.image = null;
    }


    if (userObj.created_by) {
      userObj.created_by_name = `${userObj.created_by.first_name || ""} ${userObj.created_by.last_name || ""}`.trim();
    }

    res.status(200).json({
      status: "success",
      message: "User fetched successfully",
      status_code: 200,
      data: userObj,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching user: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: {},
      });
    }

    const {
      first_name,
      last_name,
      email,
      phone_number,
      company,
      department,
      center_cost,
      role_id,
      address,
      status,
      password,
    } = req.body;

    const oldRoleId = user.role_id?.toString();
    const newRoleId = role_id?.toString();

    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.email = email || user.email;
    user.phone_number = phone_number || user.phone_number;
    user.company = company || user.company;
    user.department = department || user.department;
    user.center_cost = center_cost || user.center_cost;
    user.role_id = role_id || user.role_id;
    user.address = address || user.address;
    user.status = status || user.status;

    if (newRoleId && newRoleId !== oldRoleId) {
      user.role_id = newRoleId;

      // Update user counts per role 
      await Promise.all([
        Role.findByIdAndUpdate(oldRoleId, { $inc: { total_users: -1 } }),
        Role.findByIdAndUpdate(newRoleId, { $inc: { total_users: 1 } }),
      ]);
    }

    if (password && password.trim() !== "") {
      user.password = password;
    }
    
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const originalName = req.file.originalname;
      const folder = "uploads/profile";

      const uploaded = await uploadFileToS3(fileBuffer, originalName, folder, req.file.mimetype);
      user.image = uploaded.Key;
    }

    await user.save();

    const userObj = user.toJSON();
    userObj.image = userObj.image ? generateSignedUrl(userObj.image) : null;

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      status_code: 200,
      data: userObj,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error updating user: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(403).json({
        status: "fail",
        message: "Admins cannot delete their own profile.",
        status_code: 403,
        data: {},
      });
    }
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: {},
      });
    }

    // Check if the user has any existing orders
    const userOrderCount = await Order.countDocuments({ user_id: user._id });
    
    if (userOrderCount > 0) {
      return res.status(400).json({
        status: "fail",
        message: "User cannot be deleted because they have existing orders",
        status_code: 400,
        data: {},
      });
    }

    // Get the creator of the user to update their role count
    const creator = await User.findById(user.created_by).populate("role_id");

    if (creator?.role_id) {
      await Role.findByIdAndUpdate(creator.role_id._id, {
        $inc: { total_users: -1 },
      });
    }

    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
      status_code: 200,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting user: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Delete All Users
const deletePaginatedUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const usersToDelete = await User.find().skip(skip).limit(limit);

    if (usersToDelete.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No users found in this page range",
        status_code: 404,
        data: {},
      });
    }

    const roleCounts = {};
    let deletedCount = 0;
    const skippedUsers = [];

    for (const user of usersToDelete) {
      const userOrderCount = await Order.countDocuments({ user_id: user._id });

      if (userOrderCount > 0) {
        skippedUsers.push({
          user_id: user._id,
          email: user.email,
          reason: "User has existing orders",
        });
        continue;
      }

      const roleId = user.role_id?.toString();
      if (roleId) {
        roleCounts[roleId] = (roleCounts[roleId] || 0) + 1;
      }
      await User.findByIdAndDelete(user._id);
      deletedCount++;
    }

    // const idsToDelete = usersToDelete.map((user) => user._id);
    // await User.deleteMany({ _id: { $in: idsToDelete } });

    const roleUpdatePromises = Object.entries(roleCounts).map(
      ([roleId, count]) =>
        Role.findByIdAndUpdate(roleId, { $inc: { total_users: -count } })
    );
    await Promise.all(roleUpdatePromises);

    res.status(200).json({
      status: "success",
      message: `Deleted ${usersToDelete.length} users from page ${page}`,
      status_code: 200,
      data: {
        deletedCount,
        skippedUsers,
        page,
        limit,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting paginated users: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  deletePaginatedUsers,
};
