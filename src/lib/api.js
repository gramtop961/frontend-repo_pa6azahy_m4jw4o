// Simple API wrapper with token injection, error handling, and snake_case -> camelCase mapping

const toCamel = (s) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
const isObject = (o) => o && typeof o === 'object' && !Array.isArray(o)

export function keysToCamel(o) {
  if (Array.isArray(o)) {
    return o.map((v) => keysToCamel(v))
  } else if (isObject(o)) {
    return Object.keys(o).reduce((result, key) => {
      result[toCamel(key)] = keysToCamel(o[key])
      return result
    }, {})
  }
  return o
}

function getBaseUrl() {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
}

export async function api(path, options = {}) {
  const baseUrl = getBaseUrl()
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 204) return null
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await res.json() : await res.text()

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token')
    }
    const message = isJson ? (data.detail || 'Request failed') : 'Request failed'
    throw new Error(message)
  }

  return isJson ? keysToCamel(data) : data
}

export async function login(username, password) {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)

  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.detail || 'Login gagal')
  }
  return data
}
