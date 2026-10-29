const normalizeLocale = (locale = '') => locale.replace('_', '-').toLowerCase()

export function getPreferredSpeechVoice(locale) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const targetLocale = normalizeLocale(locale)
  const language = targetLocale.split('-')[0]
  const exactMatches = voices.filter((voice) => normalizeLocale(voice.lang) === targetLocale)
  const candidates = exactMatches.length
    ? exactMatches
    : voices.filter((voice) => normalizeLocale(voice.lang).split('-')[0] === language)

  if (!candidates.length) return voices.find((voice) => voice.default) || null

  const preferredNames = language === 'hi'
    ? [/lekha/i, /google.*hindi|hindi.*google/i]
    : [/tara/i, /natural|enhanced|premium/i, /google.*india|india.*google/i, /rishi/i]

  for (const pattern of preferredNames) {
    const match = candidates.find((voice) => pattern.test(voice.name))
    if (match) return match
  }

  return candidates.find((voice) => voice.default) || candidates[0]
}
