import axios from 'axios'

// This client is meant to be used inside a component with useAuth hook
// OR pass the token directly from your component

export const createApiClient = (getToken) => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  })

  // Add token to every request
  client.interceptors.request.use(async (config) => {
    try {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (err) {
      console.error('Error getting token:', err)
    }
    return config
  })

  return client
}

// Default axios instance for requests without auth
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})
