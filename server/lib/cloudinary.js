const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage — images are compressed and stored automatically
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "photo-share",         // folder name in your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png", "heic", "webp"],
    transformation: [
      { width: 2000, crop: "limit" }, // cap max width at 2000px
      { quality: "auto:good" },       // Cloudinary auto-compresses
      { fetch_format: "auto" },       // serves webp to browsers that support it
    ],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max upload size
});

module.exports = { upload, cloudinary };
