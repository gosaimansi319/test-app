const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoute = require('./routes/authRoutes');
const userRoute = require('./routes/userRoutes');
const supplierRoute = require('./routes/supplierRoutes');
const productRoute = require('./routes/productRoute');
const roleRoute = require('./routes/roleRoutes');
const sectorRoute = require('./routes/sectorRoutes');
const orderRoute = require('./routes/orderRoutes');
const companyRoute = require('./routes/companyRoute');
const departmentRoute = require('./routes/departmentRoutes');
const centercostRoute = require('./routes/centercostRoute');
const notificationRoute = require('./routes/notificationRoutes');
const dashboardRoute = require('./routes/dashboardRoute');
const errorHandler = require('./middleware/errorHandlerForImage');

// cron jobs
require('./cron/remindAdminsToUpdateOrderStatus');
require("./cron/dailyUserStats");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
// app.use(cors({
//     origin: '*', // for testing only; replace with frontend URL in production
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: false
// }));
app.get('/', (req, res) => {
  res.send('Backend is working!');
});
  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/suppliers', supplierRoute);
app.use('/api/product', productRoute);
app.use('/api/roles', roleRoute);
app.use('/api/sectors', sectorRoute);
app.use('/api/orders', orderRoute);
app.use('/api/company', companyRoute);
app.use('/api/department', departmentRoute);
app.use('/api/centercost', centercostRoute);
app.use('/api/notification', notificationRoute);
app.use('/api/dashboard', dashboardRoute);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
