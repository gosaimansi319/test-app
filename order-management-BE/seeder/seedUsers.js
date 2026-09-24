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

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'order_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

const generateUserId = () => {
  const today = new Date();
  const datePart = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getFullYear()).slice(-2)}`;
  const centerCode = Math.floor(100 + Math.random() * 900);
  const uniqueCode = Math.floor(10000 + Math.random() * 90000);
  return `OD-${datePart}-${centerCode}-${uniqueCode}`;
};

const ensureTables = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        permissions JSON DEFAULT NULL,
        total_users INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) DEFAULT NULL,
        company VARCHAR(150) DEFAULT NULL,
        department VARCHAR(150) DEFAULT NULL,
        center_cost VARCHAR(50) DEFAULT NULL,
        role_id INT NOT NULL,
        address TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'active',
        image TEXT DEFAULT NULL,
        user_id VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);
  } finally {
    connection.release();
  }
};

const getOrCreateRole = async (connection, roleName, permissions) => {
  const [rows] = await connection.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await connection.query(
    'INSERT INTO roles (name, permissions, total_users) VALUES (?, ?, 0)',
    [roleName, JSON.stringify(permissions)]
  );

  return result.insertId;
};

const seedUsers = async () => {
  try {
    await ensureTables();

    const connection = await pool.getConnection();

    try {
      const adminRoleId = await getOrCreateRole(connection, 'admin', [
        { module: 'user', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'order', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'product', actions: ['create', 'read', 'update', 'delete'] },
      ]);

      const managerRoleId = await getOrCreateRole(connection, 'manager', [
        { module: 'user', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'order', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'product', actions: ['create', 'read', 'update', 'delete'] },
      ]);

      const userRoleId = await getOrCreateRole(connection, 'user', [
        { module: 'user', actions: ['read'] },
        { module: 'order', actions: ['read'] },
        { module: 'product', actions: ['read'] },
      ]);

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
          role_id: adminRoleId,
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
          role_id: managerRoleId,
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
          role_id: userRoleId,
          address: 'User Address',
          status: 'active',
          image: '',
          user_id: generateUserId(),
        },
      ];

      for (const user of users) {
        const [existing] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [user.email]);

        if (existing.length === 0) {
          await connection.query(
            `INSERT INTO users (
              first_name, last_name, email, password, phone_number, company, department,
              center_cost, role_id, address, status, image, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user.first_name,
              user.last_name,
              user.email,
              user.password,
              user.phone_number,
              user.company,
              user.department,
              user.center_cost,
              user.role_id,
              user.address,
              user.status,
              user.image,
              user.user_id,
            ]
          );
        }
      }

      await connection.query('UPDATE roles SET total_users = (SELECT COUNT(*) FROM users WHERE users.role_id = roles.id)');
      console.log('Seed users completed successfully.');
    } finally {
      connection.release();
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err.message);
    await pool.end();
    process.exit(1);
  }
};

seedUsers();
