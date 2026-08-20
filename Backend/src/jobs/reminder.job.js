const cron = require('node-cron')
const nodemailer = require('nodemailer')
const InterviewReport = require('../models/interviewReport.model')
const User = require('../models/user.model')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function formatReportUrl(reportId) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  return `${baseUrl}/interview/${reportId}`
}

async function sendReminderEmail(user, report, interviewDate) {
  if (!user?.email || !report) return

  const subject = `SkillMirror reminder: interview in 3 days`
  const text = `Hi ${user.username || 'there'},\n\nThis is a friendly reminder that your interview for ${report.title || 'your target role'} is scheduled for ${new Date(interviewDate).toLocaleDateString()}.\n\nReview your plan here: ${formatReportUrl(report._id)}\n\nGood luck!\nSkillMirror Team`
  const html = `<p>Hi ${user.username || 'there'},</p><p>This is a friendly reminder that your interview for <strong>${report.title || 'your target role'}</strong> is scheduled for <strong>${new Date(interviewDate).toLocaleDateString()}</strong>.</p><p><a href="${formatReportUrl(report._id)}">View your interview report</a></p><p>Good luck!<br/>SkillMirror Team</p>`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject,
    text,
    html,
  })
}

async function findReportsForReminder() {
  const now = new Date()
  const target = new Date(now)
  target.setDate(now.getDate() + 3)
  target.setHours(0, 0, 0, 0)
  const nextDay = new Date(target)
  nextDay.setDate(target.getDate() + 1)

  return InterviewReport.find({
    interviewDate: {
      $gte: target,
      $lt: nextDay,
    },
    reminderSentAt: { $exists: false },
  }).populate('user')
}

async function runReminderJob() {
  try {
    const reports = await findReportsForReminder()
    if (!reports.length) {
      return
    }

    for (const report of reports) {
      if (!report.user?.email) continue
      try {
        await sendReminderEmail(report.user, report, report.interviewDate)
        report.reminderSentAt = new Date()
        await report.save()
      } catch (error) {
        console.error('Failed to send interview reminder for report', report._id, error)
      }
    }
  } catch (error) {
    console.error('Reminder job failed:', error)
  }
}

function startReminderScheduler() {
  // Runs once a day at 08:30 server time
  cron.schedule('30 8 * * *', () => {
    console.log('Running SkillMirror reminder job...')
    runReminderJob()
  })
}

module.exports = { startReminderScheduler, runReminderJob }
