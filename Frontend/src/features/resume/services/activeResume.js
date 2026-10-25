const ACTIVE_RESUME_KEY = 'skillmirror.activeResumeId'

export const getActiveResumeId = () => {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(ACTIVE_RESUME_KEY) || ''
  } catch {
    return ''
  }
}

export const setActiveResumeId = (resumeId) => {
  if (typeof window === 'undefined') return
  try {
    if (resumeId) window.localStorage.setItem(ACTIVE_RESUME_KEY, resumeId)
    else window.localStorage.removeItem(ACTIVE_RESUME_KEY)
  } catch {
    // Resume selection still works for the current page if storage is unavailable.
  }
}
