import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getMyTasks } from '../services/tasks'

function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const username = localStorage.getItem('username')
  const [taskCount, setTaskCount] = useState(null)

  useEffect(() => {
    if (!username) navigate('/login')
    else loadTaskCount()
  }, [])

  async function loadTaskCount() {
    try {
      const tasks = await getMyTasks()
      setTaskCount(tasks.length)
    } catch {
      setTaskCount(0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bank-primary">
            Bem-vindo, {user.firstName} {user.lastName}
          </h1>
          <p className="text-gray-500 mt-1">
            Portal de Gestão de Processos — Banco Sol
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-bank-accent">
            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Tarefas Pendentes
            </p>
            <p className="text-4xl font-bold text-bank-primary mt-1">
              {taskCount === null ? '...' : taskCount}
            </p>
            <button
              onClick={() => navigate('/tasks')}
              className="mt-4 text-sm text-bank-accent hover:underline font-medium"
            >
              Ver tarefas
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-gray-400">
            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Novo Pedido
            </p>
            <p className="text-4xl font-bold text-gray-700 mt-1">+</p>
            <button
              onClick={() => navigate('/start')}
              className="mt-4 text-sm text-gray-600 hover:underline font-medium"
            >
              Iniciar processo
            </button>
          </div>
        </div>


      </div>
    </div>
  )
}

export default Dashboard