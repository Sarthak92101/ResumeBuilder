const puppeteer = require("puppeteer")
const { buildProfessionalResumeHtml, WATERMARK } = require("./resumeTemplate")

const WATERMARK_TEXT = WATERMARK
const BRAND_PRIMARY = "#7c3aed"
const BRAND_SECONDARY = "#38bdf8"

let browserInstance = null

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildPdfShell({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${buildBaseStyles()}</style>
</head>
<body>
  <div class="watermark" aria-hidden="true"><span>${WATERMARK_TEXT}</span></div>
  <div class="page">
    <header class="doc-header">
      <div class="doc-header__brand">${WATERMARK_TEXT}</div>
      <div class="doc-header__meta">${escapeHtml(title)}</div>
    </header>
    <div class="content">${bodyHtml}</div>
    <footer class="doc-footer">${WATERMARK_TEXT}</footer>
  </div>
</body>
</html>`
}

function buildBaseStyles() {
  return `
    @page { margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #fff;
      line-height: 1.55;
    }
    .watermark {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
    }
    .watermark span {
      font-size: 58px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${BRAND_PRIMARY};
      opacity: 0.06;
      transform: rotate(-28deg);
      white-space: nowrap;
    }
    .page {
      position: relative;
      z-index: 1;
      min-height: 100vh;
    }
    .doc-header {
      background: linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_SECONDARY} 100%);
      color: #fff;
      padding: 22px 26px;
      border-radius: 0 0 12px 12px;
      margin: -14mm -12mm 20px -12mm;
      padding-left: calc(12mm + 26px);
      padding-right: calc(12mm + 26px);
    }
    .doc-header__brand {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .doc-header__meta {
      font-size: 12px;
      opacity: 0.92;
      margin-top: 6px;
    }
    .content { padding: 0 4px 40px; }
    .doc-footer {
      position: fixed;
      bottom: 8mm;
      left: 12mm;
      right: 12mm;
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      letter-spacing: 0.04em;
    }
    h1 { font-size: 20px; margin: 0 0 6px; color: ${BRAND_PRIMARY}; }
    h2 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${BRAND_PRIMARY};
      border-left: 4px solid ${BRAND_SECONDARY};
      padding-left: 10px;
      margin: 22px 0 10px;
    }
    p, li { font-size: 11px; margin: 0 0 6px; color: #334155; }
    ul { padding-left: 18px; margin: 0 0 10px; }
    .score-pill {
      display: inline-block;
      background: #f5f3ff;
      color: ${BRAND_PRIMARY};
      border: 1px solid #ddd6fe;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 18px;
    }
    .section-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .section-card p {
      white-space: pre-wrap;
      margin: 0;
    }
    .plan-card {
      border: 1px solid #e2e8f0;
      border-left: 4px solid ${BRAND_PRIMARY};
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .plan-card h3 {
      font-size: 12px;
      margin: 0 0 6px;
      color: #0f172a;
    }
    .tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: ${BRAND_SECONDARY};
      margin-bottom: 4px;
    }
    .skill-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 16px; }
    .skill-tag {
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #f5f3ff;
      color: ${BRAND_PRIMARY};
      border: 1px solid #ddd6fe;
    }
    .skill-tag--high { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    .skill-tag--medium { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .skill-tag--low { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
  `
}

function buildPlanHtml(report) {
  const title = escapeHtml(report.title || "Interview Plan")
  const technical = report.technicalQuestions || []
  const behavioural = report.behaviouralQuestions || []
  const skillGaps = report.skillGaps || []
  const plan = report.preparationPlan || []

  const gapsHtml = skillGaps
    .map(
      (g) =>
        `<span class="skill-tag skill-tag--${escapeHtml(g.severity)}">${escapeHtml(g.skill)}</span>`
    )
    .join("")

  const technicalHtml = technical
    .map(
      (q, i) => `
    <div class="plan-card">
      <span class="tag">Technical · Q${i + 1}</span>
      <h3>${escapeHtml(q.question)}</h3>
      <p><strong>Why asked:</strong> ${escapeHtml(q.intention)}</p>
      <p><strong>How to answer:</strong> ${escapeHtml(q.answer)}</p>
    </div>`
    )
    .join("")

  const behaviouralHtml = behavioural
    .map(
      (q, i) => `
    <div class="plan-card">
      <span class="tag">Behavioural · Q${i + 1}</span>
      <h3>${escapeHtml(q.question)}</h3>
      <p><strong>Why asked:</strong> ${escapeHtml(q.intention)}</p>
      <p><strong>How to answer:</strong> ${escapeHtml(q.answer)}</p>
    </div>`
    )
    .join("")

  const roadmapHtml = plan
    .map(
      (day) => `
    <div class="plan-card">
      <h3>Day ${day.day} — ${escapeHtml(day.focus)}</h3>
      <ul>${(day.tasks || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    </div>`
    )
    .join("")

  const resumeSection = report.resume
    ? `<h2>Resume snapshot</h2><div class="section-card"><p>${escapeHtml(report.resume)}</p></div>`
    : ""

  const bodyHtml = `
    <h1>${title}</h1>
    <div class="score-pill">Match score: ${report.matchScore ?? "—"}%</div>

    <h2>Skill gaps</h2>
    <div class="skill-tags">${gapsHtml || '<span class="skill-tag">None listed</span>'}</div>

    <h2>Technical questions</h2>
    ${technicalHtml || "<p>None generated.</p>"}

    <h2>Behavioural questions</h2>
    ${behaviouralHtml || "<p>None generated.</p>"}

    <h2>Preparation roadmap</h2>
    ${roadmapHtml || "<p>None generated.</p>"}

    ${resumeSection}
  `

  return buildPdfShell({
    title: "Interview Preparation Plan",
    bodyHtml,
  })
}

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  }
  return browserInstance
}

async function htmlToPdf(html) {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setContent(html, { waitUntil: "networkidle0" })

    const isResumeLayout = html.includes("resume-layout")

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: isResumeLayout
        ? { top: "0", bottom: "0", left: "0", right: "0" }
        : { top: "14mm", bottom: "18mm", left: "12mm", right: "12mm" },
    })
  } finally {
    await page.close()
  }
}

async function generateResumePdf(report) {
  return htmlToPdf(buildProfessionalResumeHtml(report))
}

async function generateInterviewPlanPdf(report) {
  return htmlToPdf(buildPlanHtml(report))
}

module.exports = { generateResumePdf, generateInterviewPlanPdf }
