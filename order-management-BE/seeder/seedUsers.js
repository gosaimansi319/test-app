// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const Role = require('../models/Role');
// require('dotenv').config();
// const generateUserId = () => {
//   const today = new Date();
//   const datePart = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getFullYear()).slice(-2)}`;
//   const centerCode = Math.floor(100 + Math.random() * 900); // Random 3-digit code
//   const uniqueCode = Math.floor(10000 + Math.random() * 90000); // Random 5-digit code
//   return `OD-${datePart}-${centerCode}-${uniqueCode}`;
// };

// const createRoles = async () => {
//   try {
//     // Check if admin role exists
//     const adminRole = await Role.findOne({ name: "admin" });

//     // If no admin role, create one with full permissions
//     if (!adminRole) {
//       const newAdminRole = new Role({
//         name: 'admin',
//         permissions: [
//           { module: 'user', actions: ['create', 'read', 'update', 'delete'] },
//           { module: 'order', actions: ['create', 'read', 'update', 'delete'] },
//           { module: 'product', actions: ['create', 'read', 'update', 'delete'] }
//         ],
//         total_users: 0 // Initialize total_users
//       });

//       await newAdminRole.save();
//       console.log("Admin role created successfully");
//     }

//     // Check if user role exists
//     const userRole = await Role.findOne({ name: "user" });

//     // If no user role, create one with read permission
//     if (!userRole) {
//       const newUserRole = new Role({
//         name: 'user',
//         permissions: [
//           { module: 'user', actions: ['read'] },
//           { module: 'order', actions: ['read'] },
//           { module: 'product', actions: ['read'] }
//         ],
//         total_users: 0 // Initialize total_users
//       });

//       await newUserRole.save();
//       console.log("User role created successfully");
//     }
//   } catch (err) {
//     console.error("Error creating roles: ", err);
//   }
// };

// const seedUsers = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     await createRoles();

//     // Fetch the roles by name (with their permissions)
//     const userRole = await Role.findOne({ name: 'user' });
//     const adminRole = await Role.findOne({ name: 'admin' });

//     if (!userRole || !adminRole) {
//       console.error('Roles not found, make sure the roles exist in the database.');
//       process.exit(1);
//     }

//     const users = [];

//     // Create 1 user
//     for (let i = 1; i <= 1; i++) {
//       users.push({
//         first_name: `User${i}`,
//         last_name: 'Test',
//         email: `user${i}@example.com`,
//         password: await bcrypt.hash('password', 10),
//         phone_number: `99900000${i}`,
//         company: 'TestCo',
//         department: 'Tech',
//         center_cost: `CC00${i}`,
//         role_id: userRole._id,
//         address: `User ${i} Address`,
//         status: 'active',
//         image: '',
//         user_id: generateUserId(),
//       });      
//     }

//     // Create 1 admin
//     for (let i = 1; i <= 1; i++) {
//       users.push({
//         first_name: `Admin${i}`,
//         last_name: 'Boss',
//         email: `admin${i}@example.com`,
//         password: await bcrypt.hash('password', 10),
//         phone_number: `88800000${i}`,
//         company: 'AdminCo',
//         department: 'Admin',
//         center_cost: `AC00${i}`,
//         role_id: adminRole._id,
//         address: `Admin ${i} Address`,
//         status: 'active',
//         image: '',
//         user_id: generateUserId(),
//       });      
//     }

//     // Insert the users into the database
//     await User.insertMany(users);

//     const userCount = users.filter(u => u.role_id.toString() === userRole._id.toString()).length;
//     const adminCount = users.filter(u => u.role_id.toString() === adminRole._id.toString()).length;

//     // Update total_users count for each role
//     await Role.findByIdAndUpdate(userRole._id, { $inc: { total_users: userCount } });
//     await Role.findByIdAndUpdate(adminRole._id, { $inc: { total_users: adminCount } });

//     console.log('Users seeded successfully');
//     process.exit();
//   } catch (err) {
//     console.error('Error seeding users:', err.message);
//     process.exit(1);
//   }
// };

// seedUsers();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

const generateUserId = () => {
  const today = new Date();
  const datePart = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getFullYear()).slice(-2)}`;
  const centerCode = Math.floor(100 + Math.random() * 900); // Random 3-digit code
  const uniqueCode = Math.floor(10000 + Math.random() * 90000); // Random 5-digit code
  return `OD-${datePart}-${centerCode}-${uniqueCode}`;
};

const createRoles = async () => {
  try {
    // Admin Role
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      await new Role({
        name: 'admin',
        permissions: [
          { module: 'user', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'order', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'product', actions: ['create', 'read', 'update', 'delete'] }
        ],
        total_users: 0
      }).save();
      console.log('Admin role created.');
    }

    // Manager Role with full permissions
    const managerRole = await Role.findOne({ name: 'manager' });
    if (!managerRole) {
      await new Role({
        name: 'manager',
        permissions: [
          { module: 'user', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'order', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'product', actions: ['create', 'read', 'update', 'delete'] }
        ],
        total_users: 0
      }).save();
      console.log('Manager role created.');
    }

    // User Role
    const userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      await new Role({
        name: 'user',
        permissions: [
          { module: 'user', actions: ['read'] },
          { module: 'order', actions: ['read'] },
          { module: 'product', actions: ['read'] }
        ],
        total_users: 0
      }).save();
      console.log('User role created.');
    }

  } catch (err) {
    console.error('Error creating roles:', err);
  }
};

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await createRoles();

    const adminRole = await Role.findOne({ name: 'admin' });
    const managerRole = await Role.findOne({ name: 'manager' });
    const userRole = await Role.findOne({ name: 'user' });

    if (!userRole || !adminRole || !managerRole) {
      console.error('Required roles not found in database.');
      process.exit(1);
    }

    const users = [
      {
        first_name: 'Vitor',
        last_name: 'Admin',
        email: 'vitoradmin@gmail.com',
        password: await bcrypt.hash('admin@hello!!2025', 10),
        phone_number: '9000000001',
        company: 'VitorCorp',
        department: 'Administration',
        center_cost: 'VC001',
        role_id: adminRole._id,
        address: 'Admin Address',
        status: 'active',
        image: '',
        user_id: generateUserId(),
      },
      {
        first_name: 'Vitor',
        last_name: 'Manager',
        email: 'vitormanager@gmail.com',
        password: await bcrypt.hash('manager@hello!!2025', 10),
        phone_number: '9000000003',
        company: 'VitorCorp',
        department: 'Operations',
        center_cost: 'VC003',
        role_id: managerRole._id,
        address: 'Manager Address',
        status: 'active',
        image: '',
        user_id: generateUserId(),
      },
      {
        first_name: 'Vitor',
        last_name: 'User',
        email: 'vitoruser@gmail.com',
        password: await bcrypt.hash('user@hello!!2025', 10),
        phone_number: '9000000002',
        company: 'VitorCorp',
        department: 'Support',
        center_cost: 'VC002',
        role_id: userRole._id,
        address: 'User Address',
        status: 'active',
        image: '',
        user_id: generateUserId(),
      },
    ];

    await User.insertMany(users);
    console.log('Users inserted successfully.');

    const roleCounts = {
      [adminRole._id.toString()]: 0,
      [managerRole._id.toString()]: 0,
      [userRole._id.toString()]: 0,
    };

    users.forEach(user => {
      const roleId = user.role_id.toString();
      if (roleCounts.hasOwnProperty(roleId)) {
        roleCounts[roleId]++;
      }
    });

    await Role.findByIdAndUpdate(adminRole._id, { $inc: { total_users: roleCounts[adminRole._id.toString()] } });
    await Role.findByIdAndUpdate(managerRole._id, { $inc: { total_users: roleCounts[managerRole._id.toString()] } });
    await Role.findByIdAndUpdate(userRole._id, { $inc: { total_users: roleCounts[userRole._id.toString()] } });

    console.log('Role user counts updated.');
    process.exit();
  } catch (err) {
    console.error('Error seeding users:', err.message);
    process.exit(1);
  }
};

seedUsers();
