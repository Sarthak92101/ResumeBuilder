import { useState } from 'react'
import { checkGrammar } from '../services/interview.api'
import { Button } from '../../../components/ui'
import '../style/grammar.scss'

const GrammarCheck = ({ text, className = '' }) => {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onCheck = async () => {
    if (!text?.trim()) {
      setError('Write something first so it can be checked.')
      setIssues([])
      return
    }

    setLoading(true)
    setError('')
    setIssues([])
    try {
      const res = await checkGrammar({ text })
      if (res.error) {
        setError(res.error)
      } else {
        setIssues(res.issues || [])
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Couldn't check grammar right now, try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`grammar-check ${className}`}>
      <div className='grammar-check__bar'>
        <Button size='sm' variant='secondary' onClick={onCheck} disabled={loading}>
          {loading ? 'Checking...' : 'Check grammar'}
        </Button>
        {issues.length > 0 && (
          <span className='grammar-check__count'>
            {issues.length} {issues.length === 1 ? 'issue' : 'issues'} found
          </span>
        )}
      </div>

      {error && <div className='grammar-check__error'>{error}</div>}

      {issues.length > 0 && (
        <ul className='grammar-check__list'>
          {issues.map((issue, i) => (
            <li key={i} className='grammar-check__item'>
              <span className='grammar-check__message'>{issue.message}</span>
              {issue.shortSuggestion && (
                <span className='grammar-check__suggestion'>
                  did you mean: <strong>{issue.shortSuggestion}</strong>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!error && issues.length === 0 && !loading && (
        <span className='grammar-check__hint'>Optional — checks your writing with LanguageTool.</span>
      )}
    </div>
  )
}

export default GrammarCheck