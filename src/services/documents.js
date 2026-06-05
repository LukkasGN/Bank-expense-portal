import axios from 'axios'

// Proxied through Vite → server.js on port 4000
// See vite.config.js: '/docs-api' → 'http://localhost:4000'
const DOCS_API = '/docs-api'

// ── Checklist ─────────────────────────────────────────────────────────────────

export async function getChecklist(processKey) {
  try {
    const response = await axios.get(`${DOCS_API}/checklist/${processKey}`)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: 'Erro ao carregar checklist' }
  }
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getDocuments(processInstanceId) {
  try {
    const response = await axios.get(`${DOCS_API}/documents/${processInstanceId}`)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: 'Erro ao carregar documentos' }
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadDocument(file, processInstanceId, processKey, author = '', checklistItemId = null) {
  try {
    // Step 1 — get a presigned PUT URL from server.js (keeps MinIO credentials off browser)
    const presignRes = await axios.post(`${DOCS_API}/presign`, {
      fileName: file.name,
      fileType: file.type,
      processInstanceId,
    })
    const { presignedUrl, objectKey } = presignRes.data

    // Step 2 — PUT file directly to MinIO via presigned URL
    await axios.put(presignedUrl, file, {
      headers: { 'Content-Type': file.type },
      transformRequest: [(data) => data], // prevent axios from serialising the File object
    })

    // Step 3 — save metadata to PostgreSQL
    const metaRes = await axios.post(`${DOCS_API}/documents`, {
      processInstanceId,
      processKey,
      checklistItemId,
      fileName:      file.name,
      objectKey,
      contentType:   file.type,
      fileSizeBytes: file.size,
      author,
    })

    return { success: true, data: metaRes.data }
  } catch (error) {
    return { success: false, message: error.response?.data?.error || 'Erro no upload' }
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteDocument(docId) {
  try {
    await axios.delete(`${DOCS_API}/documents/${docId}`)
    return { success: true }
  } catch (error) {
    return { success: false, message: 'Erro ao eliminar documento' }
  }
}
