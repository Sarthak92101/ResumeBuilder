const WATERMARK = "Sarthak Sharma"
const PRIMARY = "#5b21b6"
const SECONDARY = "#0e7490"
const SIDEBAR_BG = "#1e1b4b"
const SIDEBAR_TEXT = "#e2e8f0"
const SIDEBAR_MUTED = "#a5b4fc"

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function cleanLine(line) {
  return String(line || "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "")
    .replace(/^[-•*●]\s*/, "")
    .trim()
}

function extractContact(lines) {
  const contact = { email: "", phone: "", links: [], location: "" }

  for (const raw of lines) {
    const line = cleanLine(raw)
    if (!line) continue

    const email = line.match(/[\w.+-]+@[\w.-]+\.\w+/)
    if (email) {
      contact.email = email[0]
      continue
    }

    const phone = line.match(/(\+?\d[\d\s().-]{8,}\d)/)
    if (phone && line.replace(/\D/g, "").length >= 10) {
      contact.phone = line
      continue
    }

    if (/linkedin|github|portfolio|http/i.test(line)) {
      contact.links.push(line.replace(/^https?:\/\//i, ""))
      continue
    }

    if (
      line.length < 60 &&
      /[A-Za-z]/.test(line) &&
      !/^(skills|experience|education|objective|summary)/i.test(line)
    ) {
      if (!contact.location && /,/.test(line)) {
        contact.location = line
      }
    }
  }

  return contact
}

function isSectionHeading(line) {
  const t = cleanLine(line)
  if (!t || t.length > 55) return false

  if (/^(#{1,3}\s*)?[A-Z][A-Za-z\s/&-]+:?\s*$/.test(t)) return true

  return /^(summary|objective|profile|experience|work history|employment|education|skills|technical skills|projects|achievements|certifications|contact|strengths|hobbies|internship)/i.test(
    t.replace(/:$/, "")
  )
}

function parseResumeDocument(text) {
  const raw = String(text || "").trim()
  if (!raw) {
    return { name: WATERMARK, headline: "", contact: extractContact([]), sections: [] }
  }

  const lines = raw.split("\n").map(cleanLine).filter(Boolean)
  let name = WATERMARK
  let headline = ""
  const headerLines = []
  const sections = []
  let current = null
  let i = 0

  if (lines[0] && lines[0].length < 50 && !isSectionHeading(lines[0])) {
    name = lines[0]
    i = 1
  }

  while (i < lines.length && !isSectionHeading(lines[i])) {
    if (!headline && lines[i].length < 90 && i === 1) {
      headline = lines[i]
      i++
      continue
    }
    headerLines.push(lines[i])
    i++
  }

  for (; i < lines.length; i++) {
    if (isSectionHeading(lines[i])) {
      if (current) sections.push(current)
      current = { title: lines[i].replace(/:$/, ""), lines: [] }
    } else if (current) {
      current.lines.push(lines[i])
    } else {
      headerLines.push(lines[i])
    }
  }
  if (current) sections.push(current)

  return {
    name,
    headline,
    contact: extractContact(headerLines),
    sections,
  }
}

function sectionPlacement(title) {
  const t = title.toLowerCase()
  if (
    /skill|education|certif|language|contact|strength|hobby/.test(t)
  ) {
    return "sidebar"
  }
  return "main"
}

function renderListItems(lines) {
  const bullets = lines.filter((l) => /^[-•*●]/.test(l) || /^\d+\./.test(l))
  const prose = lines.filter((l) => !/^[-•*●]/.test(l) && !/^\d+\./.test(l))

  let html = ""

  if (prose.length) {
    html += prose.map((p) => `<p class="block-text">${escapeHtml(p)}</p>`).join("")
  }

  if (bullets.length) {
    html += `<ul class="block-list">${bullets
      .map((b) => `<li>${escapeHtml(cleanLine(b))}</li>`)
      .join("")}</ul>`
  }

  if (!html && lines.length) {
    html = `<p class="block-text">${escapeHtml(lines.join(" "))}</p>`
  }

  return html
}

function renderExperienceBlock(lines) {
  const chunks = []
  let chunk = []

  const flush = () => {
    if (!chunk.length) return
    chunks.push(chunk)
    chunk = []
  }

  for (const line of lines) {
    if (
      chunk.length &&
      /^[-•*●]/.test(line) === false &&
      line.length < 70 &&
      /^[A-Z]/.test(line) &&
      !line.endsWith(".")
    ) {
      flush()
    }
    chunk.push(line)
  }
  flush()

  if (chunks.length <= 1) {
    return `<div class="entry">${renderListItems(lines)}</div>`
  }

  return chunks
    .map((c) => {
      const title = c[0] || ""
      const rest = c.slice(1)
      return `
      <div class="entry">
        <div class="entry__head">
          <strong class="entry__title">${escapeHtml(title)}</strong>
        </div>
        ${renderListItems(rest)}
      </div>`
    })
    .join("")
}

function renderSkillsBlock(lines) {
  const text = lines.join(" ")
  const parts = text.split(/[,|•|·]/).map((s) => s.trim()).filter(Boolean)

  if (parts.length >= 3) {
    return `<div class="chips">${parts
      .map((s) => `<span class="chip">${escapeHtml(s)}</span>`)
      .join("")}</div>`
  }

  return renderListItems(lines)
}

function renderSectionBlock(section) {
  const title = escapeHtml(section.title)
  const t = section.title.toLowerCase()

  let body = ""
  if (/skill/.test(t)) {
    body = renderSkillsBlock(section.lines)
  } else if (/experience|work|employment|project|intern/.test(t)) {
    body = renderExperienceBlock(section.lines)
  } else {
    body = renderListItems(section.lines)
  }

  return `
  <section class="resume-section">
    <h2 class="resume-section__title">${title}</h2>
    <div class="resume-section__body">${body}</div>
  </section>`
}

function renderSidebarSection(section) {
  const title = escapeHtml(section.title)
  const t = section.title.toLowerCase()
  let body = /skill/.test(t)
    ? renderSkillsBlock(section.lines)
    : renderListItems(section.lines)

  return `
  <section class="sidebar-section">
    <h3 class="sidebar-section__title">${title}</h3>
    ${body}
  </section>`
}

function buildResumeStyles() {
  return `
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Georgia", "Times New Roman", serif;
      color: #1e293b;
      background: #fff;
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
      font-family: "Segoe UI", sans-serif;
      font-size: 52px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${PRIMARY};
      opacity: 0.055;
      transform: rotate(-30deg);
    }
    .resume-layout {
      position: relative;
      z-index: 1;
      display: flex;
      min-height: 297mm;
    }
    .resume-sidebar {
      width: 32%;
      background: ${SIDEBAR_BG};
      color: ${SIDEBAR_TEXT};
      padding: 28px 20px 36px;
      font-family: "Segoe UI", sans-serif;
    }
    .resume-main {
      width: 68%;
      padding: 32px 28px 40px;
      font-family: "Segoe UI", sans-serif;
    }
    .sidebar-name {
      font-size: 20px;
      font-weight: 800;
      line-height: 1.2;
      margin: 0 0 6px;
      color: #fff;
    }
    .sidebar-role {
      font-size: 11px;
      color: ${SIDEBAR_MUTED};
      margin: 0 0 20px;
      line-height: 1.4;
    }
    .contact-list {
      list-style: none;
      padding: 0;
      margin: 0 0 22px;
      font-size: 9.5px;
      line-height: 1.6;
    }
    .contact-list li {
      margin-bottom: 6px;
      word-break: break-word;
      color: #c7d2fe;
    }
    .contact-list strong {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${SECONDARY};
      margin-bottom: 2px;
    }
    .sidebar-section { margin-bottom: 20px; }
    .sidebar-section__title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #a78bfa;
      border-bottom: 1px solid rgba(167, 139, 250, 0.35);
      padding-bottom: 5px;
      margin: 0 0 10px;
    }
    .sidebar-section .block-text,
    .sidebar-section .block-list li {
      font-size: 9.5px;
      color: #e2e8f0;
      line-height: 1.5;
    }
    .sidebar-section .block-list {
      margin: 0;
      padding-left: 14px;
    }
    .chip {
      display: inline-block;
      font-size: 8.5px;
      padding: 3px 8px;
      margin: 0 4px 4px 0;
      border-radius: 4px;
      background: rgba(167, 139, 250, 0.2);
      color: #ede9fe;
      border: 1px solid rgba(167, 139, 250, 0.35);
    }
    .resume-hero { margin-bottom: 22px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .resume-hero h1 {
      font-size: 30px;
      font-weight: 800;
      margin: 0 0 6px;
      color: #0f172a;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .resume-hero .tagline {
      font-size: 13px;
      font-weight: 600;
      color: ${PRIMARY};
      margin: 0;
    }
    .resume-section { margin-bottom: 18px; page-break-inside: avoid; }
    .resume-section__title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${PRIMARY};
      margin: 0 0 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${SECONDARY};
      display: inline-block;
    }
    .block-text {
      font-size: 10.5px;
      line-height: 1.55;
      margin: 0 0 6px;
      color: #334155;
    }
    .block-list {
      margin: 0 0 8px;
      padding-left: 16px;
    }
    .block-list li {
      font-size: 10.5px;
      line-height: 1.5;
      margin-bottom: 4px;
      color: #334155;
    }
    .entry {
      margin-bottom: 12px;
      padding-left: 12px;
      border-left: 2px solid #e9d5ff;
    }
    .entry__title {
      font-size: 11px;
      color: #0f172a;
      display: block;
      margin-bottom: 4px;
    }
    .chips { margin-top: 4px; }
    .doc-footer {
      position: fixed;
      bottom: 10mm;
      right: 12mm;
      font-family: "Segoe UI", sans-serif;
      font-size: 8px;
      color: #94a3b8;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      z-index: 2;
    }
  `
}

function buildProfessionalResumeHtml(report) {
  const doc = parseResumeDocument(report.resume || "")
  const targetRole = report.title || doc.headline || "Professional"
  const name = doc.name || WATERMARK

  const sidebarSections = []
  const mainSections = []

  for (const section of doc.sections) {
    if (sectionPlacement(section.title) === "sidebar") {
      sidebarSections.push(section)
    } else {
      mainSections.push(section)
    }
  }

  if (sidebarSections.length === 0) {
    const skillSection = doc.sections.find((s) => /skill/i.test(s.title))
    if (skillSection) {
      sidebarSections.push(skillSection)
      mainSections.splice(mainSections.indexOf(skillSection), 1)
    }
  }

  const contactItems = []
  if (doc.contact.email) {
    contactItems.push(`<li><strong>Email</strong>${escapeHtml(doc.contact.email)}</li>`)
  }
  if (doc.contact.phone) {
    contactItems.push(`<li><strong>Phone</strong>${escapeHtml(doc.contact.phone)}</li>`)
  }
  if (doc.contact.location) {
    contactItems.push(`<li><strong>Location</strong>${escapeHtml(doc.contact.location)}</li>`)
  }
  doc.contact.links.forEach((link) => {
    contactItems.push(`<li><strong>Link</strong>${escapeHtml(link)}</li>`)
  })

  const contactHtml = contactItems.length
    ? `<ul class="contact-list">${contactItems.join("")}</ul>`
    : ""

  const sidebarContent =
    contactHtml + sidebarSections.map(renderSidebarSection).join("")

  const summarySection = mainSections.find((s) =>
    /summary|objective|profile/i.test(s.title)
  )
  const otherMain = mainSections.filter((s) => s !== summarySection)

  let mainHtml = `
    <header class="resume-hero">
      <h1>${escapeHtml(name)}</h1>
      <p class="tagline">${escapeHtml(targetRole)}</p>
    </header>`

  if (summarySection) {
    mainHtml += renderSectionBlock(summarySection)
  } else if (doc.headline && doc.headline !== targetRole) {
    mainHtml += `
    <section class="resume-section">
      <h2 class="resume-section__title">Summary</h2>
      <div class="resume-section__body"><p class="block-text">${escapeHtml(doc.headline)}</p></div>
    </section>`
  }

  mainHtml += otherMain.map(renderSectionBlock).join("")

  if (!doc.sections.length && report.resume) {
    mainHtml += `
    <section class="resume-section">
      <h2 class="resume-section__title">Profile</h2>
      <div class="resume-section__body"><p class="block-text">${escapeHtml(report.resume)}</p></div>
    </section>`
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${buildResumeStyles()}</style>
</head>
<body>
  <div class="watermark" aria-hidden="true"><span>${WATERMARK}</span></div>
  <div class="resume-layout">
    <aside class="resume-sidebar">
      ${sidebarContent || `<section class="sidebar-section"><h3 class="sidebar-section__title">Contact</h3><p class="block-text">—</p></section>`}
    </aside>
    <main class="resume-main">
      ${mainHtml}
    </main>
  </div>
  <footer class="doc-footer">${WATERMARK}</footer>
</body>
</html>`
}

module.exports = { buildProfessionalResumeHtml, WATERMARK }
