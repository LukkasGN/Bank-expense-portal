import { useState, useEffect } from 'react'
import axios from 'axios'

const ENGINE_URL = 'http://localhost:8080/engine-rest'

function getAuth() {
  const username = localStorage.getItem('username')
  const password = localStorage.getItem('password')
  return { username, password }
}

/**
 * Comentario
 *
 * React-native textarea that reads/writes a Camunda process variable
 * called "comentario" on the current process instance.
 *
 * Props:
 *   processInstanceId  string  — task.processInstanceId
 *   taskId             string  — for saving via task variables endpoint
 *   readOnly           bool    — true for analistas
 */
export default function Comentario({ value, onChange, readOnly = false }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-yellow-50 border-b border-yellow-200 px-5 py-3">
        <h3 className="font-semibold text-gray-700">Comentário</h3>
      </div>
      <div className="p-5">
        <textarea
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
          disabled={readOnly}
          rows={4}
          placeholder={readOnly ? '' : 'Adicione um comentário ao processo...'}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm resize-none transition-colors
            ${readOnly
              ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-700 focus:outline-none focus:border-bank-primary focus:ring-1 focus:ring-bank-primary'
            }
          `}
        />
      </div>
    </div>
  )
}