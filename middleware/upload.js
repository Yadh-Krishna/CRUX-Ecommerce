const multer = require("multer");
const path = require("path");
const fs=require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const baseUploadPath = "public/uploads";

    // Extract module name from the request path (e.g., /upload/category → "category")
    const module = req.originalUrl.split("/")[2];
    const uploadPath = `${baseUploadPath}/${module}`;

    // Ensure the directory exists before saving the file
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath); // Image upload path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

// Define file filter for allowed types
const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp"];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, GIF, WebP, SVG, and BMP files are allowed"), false);
  }

  cb(null, true);
};

// Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: fileFilter
});

module.exports = upload;