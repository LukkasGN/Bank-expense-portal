import { useState, useEffect, useCallback } from 'react'
import { getChecklist, getDocuments, uploadDocument, deleteDocument } from '../../services/documents'

/**
 * useDocuments
 * Same pattern as other hooks in this project.
 *
 * @param {string} processInstanceId  — task.processInstanceId
 * @param {string} processKey         — task.processDefinitionId?.split(':')[0]
 * @param {string} author             — localStorage.getItem('username')
 */
export function useDocuments(processInstanceId, processKey, author = '') {
  const [checklist, setChecklist] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')

  const load = useCallback(async () => {
    if (!processInstanceId) return
    setLoading(true)
    setError('')

    const [checklistRes, docsRes] = await Promise.all([
      processKey ? getChecklist(processKey) : Promise.resolve({ success: true, data: [] }),
      getDocuments(processInstanceId),
    ])

    if (checklistRes.success) setChecklist(checklistRes.data)
    else setError(checklistRes.message)

    if (docsRes.success) setDocuments(docsRes.data)
    else setError(docsRes.message)

    setLoading(false)
  }, [processInstanceId, processKey])

  useEffect(() => { load() }, [load])

  // Enrich checklist: mark items that already have a matching uploaded doc
  const enrichedChecklist = checklist.map(item => ({
    ...item,
    fulfilled: documents.some(doc => doc.checklist_item_id === item.id),
  }))

  async function handleUpload(file, checklistItemId = null) {
    setUploading(true)
    setError('')
    const result = await uploadDocument(file, processInstanceId, processKey, author, checklistItemId)
    if (result.success) setDocuments(prev => [result.data, ...prev])
    else setError(result.message)
    setUploading(false)
    return result
  }

  async function handleRemove(docId) {
    const result = await deleteDocument(docId)
    if (result.success) setDocuments(prev => prev.filter(d => d.id !== docId))
    else setError(result.message)
    return result
  }

  return {
    checklist: enrichedChecklist,
    documents,
    loading,
    uploading,
    error,
    upload: handleUpload,
    remove: handleRemove,
    refresh: load,
  }
}
