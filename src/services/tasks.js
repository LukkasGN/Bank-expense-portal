import axios from 'axios'

const ENGINE_URL = 'http://localhost:8080/engine-rest'

function getAuth() {
  return {
    username: localStorage.getItem('username'),
    password: localStorage.getItem('password')
  }
}

export async function getMyTasks() {
  const username = localStorage.getItem('username')
  const auth = getAuth()

  const [assigned, candidate] = await Promise.all([
    axios.get(`${ENGINE_URL}/task`, {
      auth,
      params: { assignee: username }
    }),
    axios.get(`${ENGINE_URL}/task`, {
      auth,
      params: { candidateUser: username }
    })
  ])

  // Merge and remove duplicates
  const all = [...assigned.data, ...candidate.data]
  const unique = all.filter((task, index, self) =>
    index === self.findIndex(t => t.id === task.id)
  )
  return unique
}

export async function claimTask(taskId) {
  const username = localStorage.getItem('username')
  await axios.post(`${ENGINE_URL}/task/${taskId}/claim`,
    { userId: username },
    { auth: getAuth() }
  )
}

export async function completeTask(taskId, variables = {}) {
  await axios.post(`${ENGINE_URL}/task/${taskId}/complete`,
    { variables },
    { auth: getAuth() }
  )
}

export async function getTaskVariables(taskId) {
  const response = await axios.get(
    `${ENGINE_URL}/task/${taskId}/form-variables`,
    { auth: getAuth() }
  )
  return response.data
}

export async function getTaskById(taskId) {
  const response = await axios.get(
    `${ENGINE_URL}/task/${taskId}`,
    { auth: getAuth() }
  )
  return response.data
}

export async function cancelProcess(processInstanceId) {
  await axios.delete(
    `${ENGINE_URL}/process-instance/${processInstanceId}`,
    { auth: getAuth() }
  )
}

export async function returnToPreviousTask(processInstanceId, currentActivityId, previousActivityId) {
  await axios.post(
    `${ENGINE_URL}/process-instance/${processInstanceId}/modification`,
    {
      instructions: [
        {
          type: "startBeforeActivity",
          activityId: previousActivityId
        },
        {
          type: "cancelAllForActivity",
          activityId: currentActivityId
        }
      ]
    },
    { auth: getAuth() }
  )
}

export async function searchAccount(accountNumber) {
  const response = await axios.get(
    `http://localhost:8080/api/accounts/search`,
    {
      auth: getAuth(),
      params: { accountNumber }
    }
  )
  return response.data
}

export async function saveTaskVariables(taskId, variables) {
  await axios.post(
    `${ENGINE_URL}/task/${taskId}/variables`,
    { modifications: variables },
    { auth: getAuth() }
  )
}

export async function getTaskFormSchema(taskId) {
  try {
    const response = await axios.get(
      `${ENGINE_URL}/task/${taskId}/deployed-form`,
      { auth: getAuth() }
    )
    return response.data
  } catch (err) {
    return null
  }
}

export async function suggestAccounts(query) {
  const response = await axios.get(
    `http://localhost:8080/api/accounts/suggest`,
    {
      auth: getAuth(),
      params: { query }
    }
  )
  return response.data
}

async function handleVoltar() {
  try {
    // Cancel current task and restart previous activity
    await returnToPreviousTask(task.processInstanceId, 'submit_form') // use your Submit task ID
    navigate('/tasks')
  } catch (err) {
    setError('Erro ao devolver processo')
  }
}

export async function getUserGroups(userId) {
  const response = await axios.get(
    `${ENGINE_URL}/identity/groups`,
    {
      auth: getAuth(),
      params: { userId }
    }
  )
  // Handle both array and object responses
  const data = response.data
  if (Array.isArray(data)) return data
  if (data.groups) return data.groups
  return []
}

async function loadTask() {
  setLoading(true)
  try {
    const [taskData, vars, formSchema] = await Promise.all([
      getTaskById(taskId),
      getTaskVariables(taskId),
      getTaskFormSchema(taskId)
    ])
    setTask(taskData)
    setSchema(formSchema)

    const groups = await getUserGroups(username)
    setUserGroups(groups.map(g => g.id))

    const prefilled = {}
    Object.entries(vars).forEach(([key, val]) => {
      prefilled[key] = val.value ?? ''
    })

    function extractDefaults(components) {
      components?.forEach(comp => {
        if (comp.defaultValue !== undefined && !prefilled[comp.key]) {
          prefilled[comp.key] = comp.defaultValue
        }
        if (comp.components) extractDefaults(comp.components)
      })
    }
    extractDefaults(formSchema?.components)

    setFormData(prefilled)
  } catch (err) {
    setError('Erro ao carregar tarefa')
  }
  setLoading(false)
}