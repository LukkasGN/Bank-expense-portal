import axios from 'axios'

const ENGINE_URL = 'http://localhost:8080/engine-rest'

export async function login(username, password) {
  try {
    const response = await axios.get(`${ENGINE_URL}/user/${username}/profile`, {
      auth: { username, password }
    })
    return { success: true, user: response.data }
  } catch (error) {
    return { success: false, message: 'Invalid username or password' }
  }
}