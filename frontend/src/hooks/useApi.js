import { useState, useCallback } from 'react'
import { useToast } from '../context/ToastContext'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { addToast } = useToast()

  const call = useCallback(async (apiFn, { successMsg, showErrorToast = true } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn()
      if (successMsg) addToast(successMsg, 'success')
      if (res.data?.notificationSent) {
        const to = res.data.to || 'recipient'
        const subject = res.data.subject || 'notification'
        addToast(`📧 Email sent to ${to} — "${subject}"`, 'info', 6000)
      }
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Request failed'
      setError(msg)
      if (showErrorToast) addToast(msg, 'error')
      return null
    } finally {
      setLoading(false)
    }
  }, [addToast])

  return { call, loading, error }
}
