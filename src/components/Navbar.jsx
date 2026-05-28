import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="bg-bank-primary text-white px-6 py-4 shadow-md border-b-4 border-bank-accent">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-bank-accent rounded-full">
          </div>
          <span className="text-xl font-bold tracking-wide">Banco Sol</span>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <button onClick={() => navigate('/dashboard')} className="hover:text-bank-accent transition-colors">
            Painel
          </button>
          <button onClick={() => navigate('/tasks')} className="hover:text-bank-accent transition-colors">
            Tarefas
          </button>
          <button onClick={() => navigate('/start')} className="hover:text-bank-accent transition-colors">
            Novo Pedido
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar