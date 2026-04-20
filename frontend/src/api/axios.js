import axios from 'axios'

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token and branch filtering to requests
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Automatically add branch_id to GET requests if a branch is selected
    const selectedBranchId = localStorage.getItem('selectedBranchId')
    if (config.method === 'get' && selectedBranchId && selectedBranchId !== 'all') {
      if (!config.params) {
        config.params = {}
      }
      config.params.branch_id = selectedBranchId
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Handle responses
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if this is a login request (let the component handle the error)
      const isLoginRequest = error.config?.url?.includes('/login')
      if (!isLoginRequest) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient
