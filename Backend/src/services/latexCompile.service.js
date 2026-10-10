const { execFile } = require("child_process")
const fs = require("fs/promises")
const os = require("os")
const path = require("path")
const { promisify } = require("util")

const execFileAsync = promisify(execFile)

async function compileLatexToPdf(source) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "skillmirror-resume-"))
  const texPath = path.join(workDir, "resume.tex")
  const pdfPath = path.join(workDir, "resume.pdf")

  try {
    await fs.writeFile(texPath, source, "utf8")

    try {
      await execFileAsync(
        process.env.TECTONIC_BIN || "tectonic",
        ["--untrusted", "--outdir", workDir, texPath],
        {
          cwd: workDir,
          timeout: 45000,
          maxBuffer: 2 * 1024 * 1024,
          env: { ...process.env, TECTONIC_UNTRUSTED_MODE: "1" },
        }
      )
    } catch (error) {
      if (error.code === "ENOENT") {
        const missingCompiler = new Error("LaTeX resume export needs Tectonic installed on the backend host. Install Tectonic or set TECTONIC_BIN to its executable path.")
        missingCompiler.code = "LATEX_COMPILER_MISSING"
        throw missingCompiler
      }
      if (error.killed || error.code === "ETIMEDOUT") {
        const timeoutError = new Error("LaTeX resume compilation took too long. Please try again.")
        timeoutError.code = "LATEX_COMPILATION_TIMEOUT"
        throw timeoutError
      }
      throw new Error(`LaTeX resume compilation failed: ${(error.stderr || error.message || "Unknown compiler error").slice(0, 1200)}`)
    }

    const pdf = await fs.readFile(pdfPath)
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new Error("LaTeX compiler did not produce a valid PDF")
    }
    return pdf
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

module.exports = { compileLatexToPdf }
