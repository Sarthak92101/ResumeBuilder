import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
})

export const uploadResume = async (file) => {
  const form = new FormData()
  form.append('resume', file)
  const res = await api.post('/api/resume/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export const listResumes = async () => {
  const res = await api.get('/api/resume/')
  return res.data
}

export const createAtsScore = async (resumeId, jobDescription) => {
  const res = await api.post('/api/resume/ats-score', { resumeId, jobDescription })
  return res.data
}

export const getAtsScores = async (resumeId) => {
  const res = await api.get(`/api/resume/ats-score/${resumeId}`)
  return res.data
}
