import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('wt_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wt_token')
      localStorage.removeItem('wt_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) => api.post('/api/auth/login', { email, password })
export const register = (data) => api.post('/api/auth/register', data)
export const getMe = () => api.get('/api/auth/me')

// ── Config ────────────────────────────────────────────────────────────────────
export const getConfig = () => api.get('/api/config')
export const getAdminConfig = () => api.get('/api/config/admin')
export const updateConfig = (data) => api.patch('/api/config/admin', data)

// ── Grouping ──────────────────────────────────────────────────────────────────
export const getPoolStatus = () => api.get('/api/grouping/status')
export const getMyPair = () => api.get('/api/grouping/my-pair')
export const performDraw = () => api.post('/api/grouping/draw')
export const adminGetGrouping = () => api.get('/api/grouping/admin')
export const adminMovePool = (userId, preference) => api.patch(`/api/grouping/admin/preferences/${userId}`, { preference })
export const adminToggleExclude = (userId, excludedFromDraw) => api.patch(`/api/grouping/admin/exclude/${userId}`, { excludedFromDraw })
export const adminCreatePair = (user1Id, user2Id) => api.post('/api/grouping/admin/pairs', { user1Id, user2Id })
export const adminBreakPair = (pairId) => api.delete(`/api/grouping/admin/pairs/${pairId}`)

// ── Logs ──────────────────────────────────────────────────────────────────────
export const getDeadlineStatus = () => api.get('/api/logs/deadline-status')
export const getMyLogs = () => api.get('/api/logs/my')
export const submitLog = (formData) => api.post('/api/logs', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminGetAllLogs = () => api.get('/api/logs/admin/all')
export const adminDisputeLog = (logId, isDisputed) => api.patch(`/api/logs/admin/${logId}/dispute`, { isDisputed })
export const adminApplyAutoZeros = () => api.post('/api/logs/admin/apply-zeros')

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const getLeaderboard = () => api.get('/api/leaderboard')
export const adminGetSnapshots = (week) => api.get(`/api/leaderboard/admin/snapshots${week ? `?week=${week}` : ''}`)
export const adminRecalculate = (weekNumber) => api.post('/api/leaderboard/admin/recalculate', { weekNumber })

// ── Config extras ─────────────────────────────────────────────────────────────
export const setEventStatus = (status) => api.post('/api/config/admin/status', { status })
export const resetEvent = () => api.post('/api/config/admin/reset')

// ── Results ───────────────────────────────────────────────────────────────────
export const getResults = () => api.get('/api/results')
export const adminPreviewResults = () => api.get('/api/results/admin/preview')
export const adminGetBonusAwards = () => api.get('/api/results/admin/bonus-awards')
export const adminPublishResults = () => api.post('/api/results/admin/publish')
export const adminUnpublishResults = () => api.post('/api/results/admin/unpublish')
export const adminAddBonusAward = (data) => api.post('/api/results/admin/bonus-awards', data)
export const adminRemoveBonusAward = (awardId) => api.delete(`/api/results/admin/bonus-awards/${awardId}`)

// ── Users ─────────────────────────────────────────────────────────────────────
export const getAllUsers = () => api.get('/api/users')
export const updateUser = (userId, data) => api.patch(`/api/users/${userId}`, data)
export const deleteUser = (userId) => api.delete(`/api/users/${userId}`)
