// utils/s3.js

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadFileToS3 = (fileBuffer, fileName, folder, contentType) => {
  const key = `${folder}/${Date.now()}-${fileName}`;  
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ACL: 'private',
    ContentType: contentType,
  };

  return s3.upload(params).promise();
};

const generateSignedUrl = (key, expiresInSeconds = 3600) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: expiresInSeconds,
  };

  return s3.getSignedUrl('getObject', params);
};

module.exports = {
  uploadFileToS3,
  generateSignedUrl,
};
