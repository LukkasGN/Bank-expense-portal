import axios from 'axios'

const ENGINE_URL = 'http://localhost:8080/engine-rest'

function getAuth() {
  return {
    username: localStorage.getItem('username'),
    password: localStorage.getItem('password')
  }
}

export async function getProcesses() {
  const response = await axios.get(`${ENGINE_URL}/process-definition`, {
    auth: getAuth(),
    params: { latestVersion: true }
  })
  return response.data
}

export async function startProcess(processKey) {
  const response = await axios.post(
    `${ENGINE_URL}/process-definition/key/${processKey}/start`,
    {},
    { auth: getAuth() }
  )
  return response.data
}