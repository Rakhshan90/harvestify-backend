const multer = require('multer');
// const sharp = require('sharp');
const path = require('path');

const multerStorage = multer.memoryStorage();

const multerFiler = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) cb(null, true);
    else cb({ message: 'file format not supported' }, false);
}

// multer configuration
const photoUpload = multer({
    storage: multerStorage,
    fileFilter: multerFiler,
    limits: { fileSize: 1000000 }
});

// product image resizing middleware
const productImageResizing = async (req, res, next) => {
    if (!req.file) next();
  
    req.file.filename = `user-${Date.now()}-${req.file.originalname}`;
  
    
  };

module.exports = { photoUpload, productImageResizing }