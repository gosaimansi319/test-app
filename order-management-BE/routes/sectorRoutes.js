// routes/sectorRoutes.js
const express = require('express');
const { createSector, getAllSectors, deleteSector } = require('../controllers/admin/sectorController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const router = express.Router();

router.use(authMiddleware);

router.post('/create', authorizeRole(['admin', 'manager']),createSector);
router.get('/', getAllSectors);
router.delete('/delete/:id' , authorizeRole(['admin']), deleteSector);

module.exports = router;