const multer = require("multer")

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are accepted'), false)
    }
    cb(null, true)
  }
})

module.exports = upload