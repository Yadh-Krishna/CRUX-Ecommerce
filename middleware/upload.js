const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    const baseUploadPath = "public/uploads";
    // Extract module name from the request path (e.g., /upload/category → "category")    
    const module = req.originalUrl.split("/")[2];   
    const uploadPath = `${baseUploadPath}/${module}`;    
    cb(null, uploadPath); // Image upload path
  },  
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and GIF files are allowed"), false);
    }
    cb(null, true);
  }
});

module.exports = upload;