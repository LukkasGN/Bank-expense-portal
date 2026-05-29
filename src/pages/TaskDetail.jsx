import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getTaskById, getTaskVariables, completeTask, getTaskFormSchema, searchAccount, saveTaskVariables, cancelProcess, suggestAccounts, getFieldOptions, getUserGroups } from '../services/tasks'

function TaskDetail() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const [task, setTask] = useState(null)
  const [schema, setSchema] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [nifOptions, setNifOptions] = useState([])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [userGroups, setUserGroups] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [fieldOptions, setFieldOptions] = useState({})

  useEffect(() => {
    if (!username) navigate('/login')
    else loadTask()
  }, [taskId])

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

      try {
        const groups = await getUserGroups(username)
        setUserGroups(groups.map(g => g.id))
        console.log('groups loaded:', groups)
      } catch (err) {
        console.error('Failed to load groups:', err)
      }

      try {
        const groups = await getUserGroups(username)
        console.log('raw groups response:', groups)
        setUserGroups(groups.map(g => g.id))
      } catch (err) {
        console.error('Failed to load groups:', err)
      }

      const prefilled = {}
      Object.entries(vars).forEach(([key, val]) => {
        prefilled[key] = val.value ?? ''
      })

      // Auto-fill creation date from task creation time
      if (taskData.created) {
        // Convert to datetime-local format: "YYYY-MM-DDTHH:mm"
        const created = new Date(taskData.created)
        const pad = n => String(n).padStart(2, '0')
        const formatted = `${created.getFullYear()}-${pad(created.getMonth()+1)}-${pad(created.getDate())}T${pad(created.getHours())}:${pad(created.getMinutes())}`
        prefilled['data_criacao'] = formatted
      }

      if (!prefilled['originador']) {
        prefilled['originador'] = username
      }

      // Extract defaultValues from schema recursively
      function extractDefaults(components) {
        components?.forEach(comp => {
          if (comp.defaultValue !== undefined && prefilled[comp.key] === undefined) {
            prefilled[comp.key] = comp.defaultValue
          }
          if (comp.components) extractDefaults(comp.components)
        })
      }
      extractDefaults(formSchema?.components)

      setFormData(prefilled)
      // Auto-search if conta_suporte already has a value
      if (prefilled['conta_suporte']) {
        try {
          const result = await searchAccount(prefilled['conta_suporte'])
          setNifOptions(result.nifs)
        } catch (err) {
          // silently fail, user can press Pesquisar manually
        }
      }
    } catch (err) {
      setError('Erro ao carregar tarefa')
    }
    // Load select options from database
    const optionTables = [
      'finalidade', 'descricao_finalidade', 'detalhe_finalidade',
      'objetivo_operacao', 'cobertura_cambial', 'despesas',
      'moeda', 'pais_destino', 'instrumento_pagamento',
      'residencia_cambial', 'cae', 'entidade_petrolifera',
      'banco_beneficiario'
    ]

    const optionResults = await Promise.all(
      optionTables.map(t => getFieldOptions(t).catch(() => []))
    )

    const options = {}
    optionTables.forEach((table, i) => {
      options[table] = optionResults[i]
    })
    setFieldOptions(options)
    setLoading(false)
  }

  async function handleAprovar() {
    if (!window.confirm('Tem a certeza que deseja aprovar este processo?')) return
    try {
      await completeTask(taskId, {
        aprovado: { value: true, type: 'Boolean' },
        voltar: { value: false, type: 'Boolean' }
      })
      navigate('/tasks')
    } catch (err) {
      setError('Erro ao aprovar processo')
    }
  }

  async function handleRejeitar() {
    if (!window.confirm('Tem a certeza que deseja rejeitar este processo?')) return
    try {
      await completeTask(taskId, {
        aprovado: { value: false, type: 'Boolean' },
        voltar: { value: false, type: 'Boolean' }
      })
      navigate('/tasks')
    } catch (err) {
      setError('Erro ao rejeitar processo')
    }
  }

  async function handlePesquisar() {
    const contaSuporte = formData['conta_suporte']
    if (!contaSuporte) {
      setError('Introduza um número de conta')
      return
    }
    setError('')
    try {
      const result = await searchAccount(contaSuporte)
      setFormData(prev => ({
        ...prev,
        nome: result.nome,
        centro_negocios: result.centro_negocios
      }))
      setNifOptions(result.nifs)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Conta não encontrada — verifique o número introduzido')
      } else {
        setError('Erro ao pesquisar conta')
      }
    }
  }

  async function handleContaSuporteChange(value) {
    handleChange('conta_suporte', value)
    if (value.length >= 2) {
      try {
        const results = await suggestAccounts(value)
        setSuggestions(results)
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  function handleSuggestionClick(accountNumber) {
    handleChange('conta_suporte', accountNumber)
    setSuggestions([])
    setShowSuggestions(false)
  }

  async function handleGravar() {
    setSubmitting(true)
    setError('')
    try {
      const camundaVars = {}
      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) return
        const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        if (typeof value === 'object') {
          camundaVars[normalizedKey] = { value: JSON.stringify(value), type: 'Json' }
        } else if (value === true || value === false || value === 'true' || value === 'false') {
          camundaVars[normalizedKey] = { value: value === true || value === 'true', type: 'Boolean' }
        } else if (!isNaN(value) && value !== '') {
          camundaVars[normalizedKey] = { value: Number(value), type: 'Double' }
        } else {
          camundaVars[normalizedKey] = { value: String(value), type: 'String' }
        }
      })
      await saveTaskVariables(taskId, camundaVars)
      navigate('/tasks')
    } catch (err) {
      setError('Erro ao gravar dados')
    }
    setSubmitting(false)
  }

  function handleChange(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  async function handleCancelar() {
    if (!window.confirm('Tem a certeza que deseja cancelar este processo?')) return
    try {
      await cancelProcess(task.processInstanceId)
      navigate('/tasks')
    } catch (err) {
      setError('Erro ao cancelar processo')
    }
  }

 async function handleVoltar() {
   if (!window.confirm('Tem a certeza que deseja devolver este processo?')) return
   try {
     await completeTask(taskId, {
       voltar: { value: true, type: 'Boolean' }
     })
     navigate('/tasks')
   } catch (err) {
     setError('Erro ao devolver processo')
   }
 }

  async function handleComplete() {
    setSubmitting(true)
    setError('')
    try {
      const camundaVars = {}
      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) return
        if (typeof value === 'object') {
          camundaVars[key] = { value: JSON.stringify(value), type: 'Json' }
        } else if (value === true || value === false || value === 'true' || value === 'false') {
          camundaVars[key] = { value: value === true || value === 'true', type: 'Boolean' }
        } else if (!isNaN(value) && value !== '') {
          camundaVars[key] = { value: Number(value), type: 'Double' }
        } else {
          camundaVars[key] = { value: String(value), type: 'String' }
        }
      })
      camundaVars['voltar'] = { value: false, type: 'Boolean' }
      await completeTask(taskId, camundaVars)
      navigate('/tasks')
    } catch (err) {
      setError('Erro ao concluir tarefa — verifique os campos obrigatórios')
    }
    setSubmitting(false)
  }

  function renderButton(btn) {
      function renderButton(btn) {
        // Hide Voltar on the first task
        if (btn.label === 'Voltar') {
          const isFirstTask = task?.name?.toLowerCase().includes('operação cambial') ||
                              task?.name?.toLowerCase().includes('operacao cambial')
          if (isFirstTask) return null
        }}
    const styleMap = {
      'Cancelar': 'bg-gray-200 text-gray-700 hover:bg-gray-300',
      'Voltar': 'bg-gray-200 text-gray-700 hover:bg-gray-300',
      'Gravar': 'bg-bank-accent text-bank-dark hover:bg-bank-accent-hover',
      'Criar Processo': 'bg-bank-primary text-white hover:bg-bank-secondary',
      'Pesquisar': 'bg-bank-accent text-bank-dark hover:bg-bank-accent-hover',
      'Inserir Banco': 'bg-bank-accent text-bank-dark hover:bg-bank-accent-hover',
      'Anexar Documento': 'bg-bank-accent text-bank-dark hover:bg-bank-accent-hover',
      'Aprovar': 'bg-green-600 text-white hover:bg-green-700',
      'Rejeitar': 'bg-red-600 text-white hover:bg-red-700',
    }
    const style = styleMap[btn.label] || 'bg-gray-200 text-gray-700 hover:bg-gray-300'

    // Inline buttons (Pesquisar, Inserir Banco) stay small
    const inlineButtons = ['Pesquisar', 'Inserir Banco', 'Anexar Documento']
    const isInline = inlineButtons.includes(btn.label)
    const sizeClass = isInline
      ? 'px-3 py-2 text-xs self-end'
      : 'px-6 py-2.5 text-sm'

    const handleButtonClick = () => {
      if (btn.label === 'Cancelar') handleCancelar()
      else if (btn.label === 'Voltar') handleVoltar()
      else if (btn.label === 'Gravar') handleGravar()
      else if (btn.label === 'Criar Processo') handleComplete()
      else if (btn.label === 'Pesquisar') handlePesquisar()
      else if (btn.label === 'Aprovar') handleAprovar()
      else if (btn.label === 'Rejeitar') handleRejeitar()
    }

    if (btn.label === 'Voltar') {
      const firstTasks = ['Inicio operação Cambial', 'Inicio Operação Cambial']
      if (firstTasks.some(name => task?.name?.includes(name) || task?.name === name)) {
        return null
      }
    }

    return (
      <button
        key={btn.id}
        onClick={handleButtonClick}
        className={`rounded-lg font-medium transition-colors text-center ${style} ${sizeClass}`}
      >
        {btn.label}
      </button>
    )
  }

  function renderField(component) {
    const { key, label, type, values, validate, readonly, disabled, defaultValue } = component
    const isReadOnly = readonly || disabled
    const currentValue = formData[key] ?? defaultValue ?? ''

    const baseInput = "w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-bank-accent text-sm"
    const readOnlyInput = "w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-600 text-sm"

    if (type === 'button') return renderButton(component)

    if (type === 'textfield' || type === 'number' || type === 'textarea') {
      // Special autocomplete for conta_suporte
      if (key === 'conta_suporte') {
        return (
          <div key={component.id} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
              {validate?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={currentValue}
              onChange={e => handleContaSuporteChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className={isReadOnly ? readOnlyInput : baseInput}
              placeholder="Digite para pesquisar..."
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {suggestions.map(s => (
                  <div
                    key={s.account_number}
                    onMouseDown={() => handleSuggestionClick(s.account_number)}
                    className="px-4 py-2 hover:bg-bank-accent hover:text-bank-dark cursor-pointer text-sm border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium">{s.account_number}</span>
                    <span className="text-gray-500 ml-2">— {s.nome}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }

      // Regular textfield
      return (
        <div key={component.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {validate?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {type === 'textarea' ? (
            <textarea
              value={currentValue}
              onChange={e => handleChange(key, e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className={isReadOnly ? readOnlyInput : baseInput}
            />
          ) : (
            <input
              type={type === 'number' ? 'number' : 'text'}
              value={currentValue}
              onChange={e => handleChange(key, e.target.value)}
              disabled={isReadOnly}
              className={isReadOnly ? readOnlyInput : baseInput}
            />
          )}
        </div>
      )
    }

    if (type === 'datetime') {
      const displayLabel = component.dateLabel || label
      return (
        <div key={component.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {displayLabel}
            {validate?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="datetime-local"
            value={currentValue}
            onChange={e => handleChange(key, e.target.value)}
            disabled={isReadOnly}
            className={isReadOnly ? readOnlyInput : baseInput}
          />
        </div>
      )
    }

    if (type === 'spacer') {
      return (
        <div
          key={component.id}
          style={{ height: `${component.height || 20}px` }}
        />
      )
    }

    if (type === 'table') {
      return (
        <div key={component.id} className="overflow-x-auto">
          <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
          <table className="w-full border border-gray-200 rounded-lg text-sm">
            <thead className="bg-gray-50">
              <tr>
                {component.columns?.map(col => (
                  <th key={col.key} className="px-3 py-2 text-left text-gray-600 font-medium border-b">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={component.columns?.length} className="px-3 py-4 text-center text-gray-400">
                  Sem dados
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (type === 'separator') {
      return <hr key={component.id} className="border-gray-200 my-2" />
    }

    if (type === 'html') {
      return (
        <div
          key={component.id}
          className="text-gray-500 text-sm"
          dangerouslySetInnerHTML={{ __html: label }}
        />
      )
    }

    if (type === 'datetime') {
      return (
        <div key={component.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {validate?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="datetime-local"
            value={currentValue}
            onChange={e => handleChange(key, e.target.value)}
            disabled={isReadOnly}
            className={isReadOnly ? readOnlyInput : baseInput}
          />
        </div>
      )
    }

    if (type === 'textfield' || type === 'number' || type === 'textarea') {
      return (
        <div key={component.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {validate?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {type === 'textarea' ? (
            <textarea
              value={currentValue}
              onChange={e => handleChange(key, e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className={isReadOnly ? readOnlyInput : baseInput}
            />
          ) : (
            <input
              type={type === 'number' ? 'number' : 'text'}
              value={currentValue}
              onChange={e => handleChange(key, e.target.value)}
              disabled={isReadOnly}
              className={isReadOnly ? readOnlyInput : baseInput}
            />
          )}
        </div>
      )
    }

    if (type === 'select') {
      const keyToTable = {
        'finalidade': 'finalidade',
        'descricao_finalidade': 'descricao_finalidade',
        'detalhe_finalidade': 'detalhe_finalidade',
        'objetivo_operacao': 'objetivo_operacao',
        'cobertura_cambial': 'cobertura_cambial',
        'despesas': 'despesas',
        'moeda': 'moeda',
        'pais_destino': 'pais_destino',
        'intrumento_pagamento': 'instrumento_pagamento',
        'residencia_cambial': 'residencia_cambial',
        'cae': 'cae',
        'entidade_petrolifera': 'entidade_petrolifera',
        'select_9t5m27': 'banco_beneficiario',
      }

      const dbOptions = keyToTable[key] ? fieldOptions[keyToTable[key]] : null
      const selectOptions = (key === 'nif' && nifOptions.length > 0)
        ? nifOptions
        : (dbOptions && dbOptions.length > 0)
          ? dbOptions
          : values

      return (
        <div key={component.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {validate?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={currentValue}
            onChange={e => handleChange(key, e.target.value)}
            disabled={isReadOnly}
            className={isReadOnly ? readOnlyInput : baseInput}
          >
            <option value="">Selecionar...</option>
            {selectOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )
    }

    if (type === 'select') {
      // Use dynamic options for NIF if available
      const selectOptions = (component.key === 'nif' && nifOptions.length > 0)
        ? nifOptions
        : values

      return (
        <div key={component.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {validate?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={currentValue}
            onChange={e => handleChange(key, e.target.value)}
            disabled={isReadOnly}
            className={isReadOnly ? readOnlyInput : baseInput}
          >
            <option value="">Selecionar...</option>
            {selectOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )
    }

    // Fallback for unknown types
    return (
      <div key={component.id}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="text"
          value={currentValue}
          onChange={e => handleChange(key, e.target.value)}
          disabled={isReadOnly}
          className={isReadOnly ? readOnlyInput : baseInput}
        />
      </div>
    )
  }

  function renderDynamicList(group) {
    const subComponents = group.components || []
    const rowMap = {}
    subComponents.forEach(comp => {
      const row = comp.layout?.row || comp.id
      if (!rowMap[row]) rowMap[row] = []
      rowMap[row].push(comp)
    })

    return (
      <div key={group.id} className="border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 border-b pb-2">{group.label}</h3>
        {Object.entries(rowMap).map(([row, fields]) => {
          const count = fields.length
          const gridClass =
            count === 1 ? 'grid-cols-1' :
            count === 2 ? 'grid-cols-2' :
            count === 3 ? 'grid-cols-3' :
            count === 4 ? 'grid-cols-4' :
            'grid-cols-5'
          return (
            <div key={row} className={`grid gap-4 ${gridClass}`}>
              {fields.map(field => renderField(field))}
            </div>
          )
        })}
      </div>
    )
  }

  function renderForm() {
    if (!schema) return null

    const components = schema.components || []
    const isAnaliseTask = task?.name?.includes('Análise')

    const fields = components.filter(c => c.type !== 'button')
    const buttons = components.filter(c =>
      c.type === 'button' && c.label !== 'Criar Processo'
    )

    return (
      <div className="space-y-6">
        {fields.map(component => (
          component.type === 'dynamiclist'
            ? renderDynamicList(component)
            : renderField(component)
        ))}
        {buttons.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-3">
              {buttons.map(btn => renderButton(btn))}
            </div>
            {!task?.name?.includes('Análise') && (
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="px-6 py-2.5 bg-bank-primary text-white rounded-lg font-medium hover:bg-bank-secondary transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? 'A processar...' : 'Criar Processo'}
              </button>
            )}
          </div>
        )}
      </div>
    )}

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/tasks')}
          className="text-bank-primary text-sm hover:underline mb-6 flex items-center gap-1"
        >
          ← Voltar às Tarefas
        </button>

        {loading ? (
          <div className="text-center py-20 text-gray-400">A carregar tarefa...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-bank-primary">{task?.name}</h1>
              <p className="text-gray-400 text-sm mt-1">
                Processo: {task?.processDefinitionId?.split(':')[0]}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
                {error}
              </div>
            )}

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6">
                Dados gravados com sucesso!
              </div>
            )}

            {renderForm()}

            {!task?.name?.includes('Análise') && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="flex gap-3">
                  {/* Left buttons rendered by renderForm */}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskDetail