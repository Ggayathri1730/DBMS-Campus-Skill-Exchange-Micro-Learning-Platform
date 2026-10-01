const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const token = localStorage.getItem('campus_exchange_token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error(`Backend unavailable at ${API_URL}. Start FastAPI and check backend/.env.`)
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.detail || 'The request could not be completed.')
  return payload
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export const api = {
  publicStats: () => request('/public/stats'),
  register: payload => request('/auth/register', json('POST', payload)),
  login: payload => request('/auth/login', json('POST', payload)),
  me: () => request('/auth/me'),
  summary: () => request('/students/me/summary'),
  updateProfile: (id, payload) => request(`/students/${id}`, json('PUT', payload)),
  students: () => request('/students'),
  skills: () => request('/skills'),
  createSkill: payload => request('/skills', json('POST', payload)),
  studentSkills: id => request(`/students/${id}/skills`),
  addStudentSkill: (id, payload) => request(`/students/${id}/skills`, json('POST', payload)),
  removeStudentSkill: (id, skillId) => request(`/students/${id}/skills/${skillId}`, { method: 'DELETE' }),
  matches: () => request('/matches'),
  recommendedMatches: () => request('/matches/recommended'),
  requests: () => request('/requests'),
  createRequest: payload => request('/requests', json('POST', payload)),
  updateRequest: (id, status) => request(`/requests/${id}`, json('PUT', { status })),
  courses: () => request('/courses'),
  createCourse: payload => request('/courses', json('POST', payload)),
  updateCourse: (id, payload) => request(`/courses/${id}`, json('PUT', payload)),
  deleteCourse: id => request(`/courses/${id}`, { method: 'DELETE' }),
  enroll: id => request(`/courses/${id}/enroll`, { method: 'POST' }),
  enrollments: () => request('/enrollments'),
  progress: () => request('/progress'),
  updateProgress: (id, payload) => request(`/progress/${id}`, json('PUT', payload)),
  sessions: () => request('/progress/sessions'),
  createSession: payload => request('/progress/sessions', json('POST', payload)),
  reviews: () => request('/reviews'),
  createReview: payload => request('/reviews', json('POST', payload)),
  adminOverview: () => request('/admin/overview'),
  adminRequests: () => request('/admin/requests'),
}
