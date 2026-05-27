import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getMyTasks, claimTask } from '../services/tasks'

function Tasks() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!username) navigate('/login')
    else loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    try {
      const data = await getMyTasks()
      setTasks(data)
    } catch (err) {
      setError('Erro ao carregar tarefas')
    }
    setLoading(false)
  }

  async function handleClaim(taskId) {
    try {
      await claimTask(taskId)
      await loadTasks()
    } catch (err) {
      setError('Erro ao reclamar tarefa')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-bank-primary">As Minhas Tarefas</h1>
            <p className="text-gray-500 mt-1">Tarefas atribuídas ou disponíveis para reclamar</p>
          </div>
          <button
            onClick={loadTasks}
            className="bg-bank-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bank-secondary transition-colors"
          >
            Atualizar
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg">A carregar tarefas...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl font-bold">0</span>
            </div>
            <p className="text-gray-400 text-lg">Sem tarefas disponíveis</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="bg-white rounded-xl shadow p-6 flex items-center justify-between border-l-4 border-bank-accent">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{task.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Processo: {task.processDefinitionId?.split(':')[0]}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Criado: {new Date(task.created).toLocaleString('pt-PT')}
                  </p>
                  <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${
                    task.assignee
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-bank-accent text-bank-dark'
                  }`}>
                    {task.assignee ? `Atribuído a ${task.assignee}` : 'Disponível'}
                  </span>
                </div>

                <div className="flex gap-3">
                  {!task.assignee && (
                    <button
                      onClick={() => handleClaim(task.id)}
                      className="bg-bank-accent text-bank-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-bank-accent-hover transition-colors"
                    >
                      Reclamar
                    </button>
                  )}
                  {task.assignee === username && (
                    <button
                      onClick={() => navigate(`/task/${task.id}`)}
                      className="bg-bank-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bank-secondary transition-colors"
                    >
                      Abrir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tasks