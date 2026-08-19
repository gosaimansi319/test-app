// middleware/upload.js

const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpeg, jpg, png, pdf, doc, and docx files are allowed'), false);
  }
};

const createUploader = () =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
  });

module.exports = createUploader;