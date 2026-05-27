import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Por favor insira o utilizador e a senha')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(username, password)
    setLoading(false)
    if (result.success) {
      localStorage.setItem('username', username)
      localStorage.setItem('password', password)
      localStorage.setItem('user', JSON.stringify(result.user))
      navigate('/dashboard')
    } else {
      setError('Utilizador ou senha inválidos')
    }
  }

  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-bank-accent rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-bank-dark font-black text-2xl">BS</span>
          </div>
          <h1 className="text-3xl font-bold text-bank-primary">Banco Sol</h1>
          <p className="text-gray-500 mt-1">Portal de Aprovação de Despesas</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utilizador
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-bank-accent text-sm"
              placeholder="Introduza o seu utilizador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-bank-accent text-sm"
              placeholder="Introduza a sua senha"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-bank-accent text-bank-dark py-3 rounded-lg font-bold hover:bg-bank-accent-hover transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'A autenticar...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 Banco Sol — Uso Interno
        </p>
      </div>
    </div>
  )
}

export default Login