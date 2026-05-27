import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import StartProcess from './pages/StartProcess'
import TaskDetail from './pages/TaskDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/start" element={<StartProcess />} />
      <Route path="/task/:taskId" element={<TaskDetail />} />
    </Routes>
  )
}

export default App