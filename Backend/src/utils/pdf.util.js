const { PDFParse } = require("pdf-parse")

async function extractTextFromPdf(buffer) {
  if (!buffer?.length) {
    throw new Error("Invalid PDF file")
  }

  const parser = new PDFParse({ data: buffer })

  try {
    await parser.load()
    const result = await parser.getText()
    const text = (result?.text || "").trim()

    if (!text) {
      throw new Error("Could not extract text from PDF. The file may be scanned or empty.")
    }

    return text
  } finally {
    await parser.destroy()
  }
}

module.exports = { extractTextFromPdf }
