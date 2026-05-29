import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getProcesses, startProcess } from '../services/processes'

function StartProcess() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!username) navigate('/login')
    else loadProcesses()
  }, [])

  async function loadProcesses() {
    setLoading(true)
    try {
      const data = await getProcesses()
      setProcesses(data)
    } catch (err) {
      setError('Erro ao carregar processos')
    }
    setLoading(false)
  }

  async function handleStart(processKey, processName) {
    setStarting(processKey)
    setError('')
    try {
        await startProcess(processKey)
        navigate('/tasks')
      } catch (err) {
        setError('Erro ao iniciar processo')
      }
      setStarting(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bank-primary">Novo Pedido</h1>
          <p className="text-gray-500 mt-1">Selecione um processo para iniciar</p>
        </div>

        {success && (
          <div className="bg-gray-800 border border-bank-accent text-white rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-6 h-6 bg-bank-accent rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-bank-dark font-bold text-xs">✓</span>
            </div>
            <div>
              <p className="font-medium">{success}</p>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-bank-accent hover:underline mt-1"
              >
                Ver Tarefas
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg">A carregar processos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processes.map(process => (
              <div key={process.id} className="bg-white rounded-xl shadow p-6 border-t-4 border-bank-accent">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {process.name || process.key}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Chave: {process.key}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Versão: {process.version}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 font-bold text-sm">
                      {(process.name || process.key).charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStart(process.key, process.name || process.key)}
                  disabled={starting === process.key}
                  className="mt-5 w-full bg-bank-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-bank-secondary transition-colors disabled:opacity-50"
                >
                  {starting === process.key ? 'A iniciar...' : 'Iniciar Processo'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StartProcess