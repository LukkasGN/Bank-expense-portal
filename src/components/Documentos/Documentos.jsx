import { useRef, useState } from 'react'
import { useDocuments } from './useDocuments'

/**
 * Documentos
 *
 * Drop-in component for TaskDetail.jsx — wraps inside the existing white card.
 *
 * Props:
 *   processInstanceId  string   — task.processInstanceId  (from Camunda)
 *   processKey         string   — task.processDefinitionId?.split(':')[0]
 *   author             string   — username from localStorage
 *   readOnly           bool     — true when task is completed / Análise
 */
export default function Documentos({ processInstanceId, processKey, author = '', readOnly = false }) {
  const { checklist, documents, loading, uploading, error, upload, remove } =
    useDocuments(processInstanceId, processKey, author)

  const fileInputRef              = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(null)   // checklist item being fulfilled
  const [dragOver, setDragOver]   = useState(false)
  const [uploadError, setUploadError] = useState('')

  // ── helpers ───────────────────────────────────────────────────────────────
  function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024)        return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function fileIcon(contentType) {
    if (contentType === 'application/pdf')    return '📕'
    if (contentType?.startsWith('image/'))    return '🖼️'
    return '📄'
  }

  // ── upload flow ───────────────────────────────────────────────────────────
  function openModal(checklistItem = null) {
    setActiveItem(checklistItem)
    setUploadError('')
    setModalOpen(true)
  }

  async function handleFiles(files) {
    setUploadError('')
    for (const file of Array.from(files)) {
      const result = await upload(file, activeItem?.id ?? null)
      if (!result.success) {
        setUploadError(result.message)
        return
      }
    }
    setModalOpen(false)
    setActiveItem(null)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Panel — same border/radius as renderDynamicList ────────────────── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">

        {/* Header — identical yellow style to renderDynamicList */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-5 py-3">
          <h3 className="font-semibold text-gray-700">Documentos</h3>
        </div>

        <div className="p-5 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {/* ── Checklist Documental ──────────────────────────────────────── */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Checklist Documental</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-20">Anexado</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Documento</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Tipo de Documento</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Obrigatório</th>
                    {!readOnly && <th className="px-4 py-2.5 w-24"></th>}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={readOnly ? 4 : 5} className="text-center text-gray-400 py-6">
                        A carregar...
                      </td>
                    </tr>
                  )}
                  {!loading && checklist.length === 0 && (
                    <tr>
                      <td colSpan={readOnly ? 4 : 5} className="text-center text-gray-400 py-6">
                        Sem dados
                      </td>
                    </tr>
                  )}
                  {checklist.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-t border-gray-100 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                    >
                      <td className="px-4 py-3 text-center">
                        {item.fulfilled ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold text-xs">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs">○</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.document_name}</td>
                      <td className="px-4 py-3 text-gray-500">{item.document_type}</td>
                      <td className="px-4 py-3 text-center">
                        {item.required ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                            Sim
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Não
                          </span>
                        )}
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3 text-right">
                          {!item.fulfilled && (
                            <button
                              onClick={() => openModal(item)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors font-medium"
                            >
                              Anexar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Botão principal — same style as bank-primary buttons ─────── */}
          {!readOnly && (
            <button
              onClick={() => openModal(null)}
              disabled={uploading}
              className="w-full py-3 bg-bank-primary text-white rounded-xl font-medium hover:bg-bank-secondary transition-colors disabled:opacity-50 text-sm"
            >
              {uploading ? 'A enviar...' : 'Anexar Documento'}
            </button>
          )}

          {/* ── Documentos Anexados ──────────────────────────────────────── */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Documentos Anexados</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Nome do Documento</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Autor</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Tamanho</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Data</th>
                    {!readOnly && <th className="px-4 py-2.5 w-16"></th>}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={readOnly ? 4 : 5} className="text-center text-gray-400 py-6">
                        A carregar...
                      </td>
                    </tr>
                  )}
                  {!loading && documents.length === 0 && (
                    <tr>
                      <td colSpan={readOnly ? 4 : 5} className="text-center text-gray-400 py-6">
                        Sem dados
                      </td>
                    </tr>
                  )}
                  {documents.map((doc, idx) => (
                    <tr
                      key={doc.id}
                      className={`border-t border-gray-100 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                    >
                      <td className="px-4 py-3">
                        <a
                          href={doc.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-bank-primary hover:underline"
                        >
                          <span>{fileIcon(doc.content_type)}</span>
                          <span className="truncate max-w-xs">{doc.file_name}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{doc.author || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{formatSize(doc.file_size_bytes)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(doc.uploaded_at)}</td>
                      {!readOnly && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Eliminar "${doc.file_name}"?`)) remove(doc.id)
                            }}
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            title="Eliminar"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* ── Upload modal ───────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-semibold text-gray-700">
                {activeItem ? `Anexar: ${activeItem.document_name}` : 'Anexar Documento'}
              </h4>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                ${dragOver
                  ? 'border-bank-primary bg-yellow-50'
                  : 'border-gray-200 hover:border-bank-primary hover:bg-yellow-50/40'}
              `}
            >
              <div className="text-3xl mb-3">📎</div>
              <p className="text-sm text-gray-600">
                Arraste ficheiros aqui ou <span className="font-semibold text-bank-primary">clique para seleccionar</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPEG ou PNG · máx. 20 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-bank-primary rounded-full animate-pulse w-2/3" />
                </div>
                <span className="text-xs text-gray-400">A enviar...</span>
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                {uploadError}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
