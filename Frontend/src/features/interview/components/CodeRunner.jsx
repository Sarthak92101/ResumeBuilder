import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { runUserCode } from '../services/interview.api'
import { Button } from '../../../components/ui'
import '../style/codeRunner.scss'

const LANGS = [
  { value: 'javascript', label: 'JavaScript (Node.js)' },
  { value: 'python', label: 'Python 3' },
  { value: 'java', label: 'Java' },
]

const STARTER_CODE = {
  javascript: `const fs = require('fs')
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/)
// TODO: parse \`input\` and print your answer with console.log()
`,
  python: `import sys

data = sys.stdin.read().split()
# TODO: parse \`data\` and print your answer
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: read input and print your answer
    }
}
`,
}

const CodeRunner = ({ questionId }) => {
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(STARTER_CODE.javascript)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  const onLanguageChange = (e) => {
    const next = e.target.value
    setLanguage(next)
    setCode(STARTER_CODE[next] || '')
    setResults([])
    setError('')
  }

  const onRun = async () => {
    if (!code.trim()) {
      setError('Write some code first.')
      return
    }
    if (!questionId) {
      setError("Couldn't run code right now, try again.")
      return
    }

    setRunning(true)
    setResults([])
    setError('')
    try {
      const res = await runUserCode({ code, language, questionId })
      setResults(res.result?.results || [])
      if (res.error) setError(res.error)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Couldn't run code right now, try again."
      )
    } finally {
      setRunning(false)
    }
  }

  const passed = results.filter((r) => r.pass).length

  return (
    <div className='code-runner'>
      <div className='code-runner__toolbar'>
        <select
          className='code-runner__lang'
          value={language}
          onChange={onLanguageChange}
          aria-label='Language'
        >
          {LANGS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <Button size='sm' variant='primary' onClick={onRun} disabled={running}>
          {running ? 'Running...' : 'Run Code'}
        </Button>
      </div>

      <div className='code-runner__editor'>
        <Editor
          height='220px'
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme='vs-dark'
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
          }}
        />
      </div>

      {error && <div className='code-runner__error'>{error}</div>}

      {results.length > 0 && (
        <div className='code-runner__results'>
          <div className='code-runner__summary'>
            {passed} / {results.length} test cases passed
          </div>
          {results.map((r, i) => (
            <div key={i} className={`code-runner__case ${r.pass ? 'code-runner__case--pass' : 'code-runner__case--fail'}`}>
              <div className='code-runner__case-head'>
                <span className='code-runner__case-status'>{r.pass ? 'PASS' : 'FAIL'}</span>
                <span className='code-runner__case-label'>Test case {i + 1}</span>
                {r.time != null && <span className='code-runner__case-time'>{r.time}s</span>}
              </div>
              <div className='code-runner__case-body'>
                <div className='code-runner__case-row'>
                  <span className='code-runner__case-key'>Input</span>
                  <pre className='code-runner__case-val'>{r.input || '(empty)'}</pre>
                </div>
                <div className='code-runner__case-row'>
                  <span className='code-runner__case-key'>Expected</span>
                  <pre className='code-runner__case-val'>{r.expectedOutput || '(empty)'}</pre>
                </div>
                <div className='code-runner__case-row'>
                  <span className='code-runner__case-key'>Actual</span>
                  <pre className='code-runner__case-val'>{r.output || r.error || '(no output)'}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CodeRunner