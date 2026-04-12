const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists, otherwise the server crashes
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 🛠️ THE FIX: This configuration FORCES the backend to keep the file extension!
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Grab the extension from the frontend (e.g., .webm or .mp4)
    const ext = path.extname(file.originalname) || '.webm';
    // Save it as timestamp + extension so the browser knows it is audio
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    // Returns the clean path: /uploads/1712345678.webm
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Server upload error");
  }
});

module.exports = router;