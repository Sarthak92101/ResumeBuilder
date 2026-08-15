const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const upload = require('../middlewares/file.middleware')
const resumeController = require('../controllers/resume.controller')

const router = express.Router()

const uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File size exceeds 5MB limit' })
    return res.status(400).json({ message: err.message || 'File upload failed' })
  })
}

router.post('/', authMiddleware.authUser, uploadResume, resumeController.uploadResumeController)
router.get('/', authMiddleware.authUser, resumeController.listResumesController)

/* ATS score endpoints */
const atsController = require('../controllers/ats.controller')
router.post('/ats-score', authMiddleware.authUser, atsController.createAtsScoreController)
router.get('/ats-score/:resumeId', authMiddleware.authUser, atsController.listAtsScoresController)

module.exports = router
