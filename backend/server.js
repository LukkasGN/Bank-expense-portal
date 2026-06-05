/**
 * backend/server.js
 *
 * Start:  node backend/server.js
 * Port:   4000  (Vite proxies /docs-api → here)
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import * as Minio from 'minio'
import pg from 'pg'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// dotenv doesn't auto-find .env.local in ESM mode — point to project root
import { config } from 'dotenv'
config({ path: path.resolve(__dirname, '../.env.local') })

const { Pool } = pg
const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ── MinIO ─────────────────────────────────────────────────────────────────────
const minio = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT  || 'localhost',
  port:      Number(process.env.MINIO_PORT) || 9000,
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
})

const BUCKET       = process.env.MINIO_BUCKET   || 'documents'
const PRESIGN_SECS = Number(process.env.PRESIGN_EXPIRY) || 3600

// Auto-create bucket on startup
try {
  const exists = await minio.bucketExists(BUCKET)
  if (!exists) {
    await minio.makeBucket(BUCKET)
    console.log(`✅  Bucket "${BUCKET}" created`)
  }
  console.log(`🪣  MinIO bucket "${BUCKET}" ready`)
} catch (err) {
  console.error('❌  MinIO connection failed:', err.message)
  console.error('    → Is AIStor running? Check MINIO_ENDPOINT/PORT in .env.local')
}

// ── PostgreSQL ────────────────────────────────────────────────────────────────
const db = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user:     process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /checklist/:processKey
app.get('/checklist/:processKey', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, document_name, document_type, required
       FROM document_checklist
       WHERE process_key = $1
       ORDER BY required DESC, id`,
      [req.params.processKey]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao carregar checklist' })
  }
})

// GET /documents/:processInstanceId
app.get('/documents/:processInstanceId', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pd.id, pd.file_name, pd.content_type, pd.file_size_bytes,
              pd.author, pd.uploaded_at, pd.minio_object_key,
              pd.checklist_item_id,
              dc.document_name AS checklist_name, dc.document_type
       FROM process_documents pd
       LEFT JOIN document_checklist dc ON pd.checklist_item_id = dc.id
       WHERE pd.process_instance_id = $1
       ORDER BY pd.uploaded_at DESC`,
      [req.params.processInstanceId]
    )
    const docs = await Promise.all(rows.map(async row => ({
      ...row,
      download_url: await minio.presignedGetObject(BUCKET, row.minio_object_key, PRESIGN_SECS),
    })))
    res.json(docs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao carregar documentos' })
  }
})

// POST /presign
app.post('/presign', async (req, res) => {
  try {
    const { fileName, fileType, processInstanceId } = req.body
    if (!fileName || !processInstanceId)
      return res.status(400).json({ error: 'fileName e processInstanceId são obrigatórios' })

    const ext       = path.extname(fileName)
    const base      = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
    const objectKey = `${processInstanceId}/${uuidv4()}_${base}${ext}`

    const presignedUrl = await minio.presignedPutObject(BUCKET, objectKey, PRESIGN_SECS)
    res.json({ presignedUrl, objectKey })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao gerar URL de upload' })
  }
})

// POST /documents
app.post('/documents', async (req, res) => {
  try {
    const {
      processInstanceId, processKey, checklistItemId,
      fileName, objectKey, contentType, fileSizeBytes, author,
    } = req.body

    const { rows } = await db.query(
      `INSERT INTO process_documents
         (process_instance_id, process_key, checklist_item_id,
          file_name, minio_bucket, minio_object_key,
          content_type, file_size_bytes, author)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, file_name, content_type, file_size_bytes, author, uploaded_at`,
      [
        processInstanceId, processKey || null, checklistItemId || null,
        fileName, BUCKET, objectKey, contentType, fileSizeBytes, author || null,
      ]
    )

    const download_url = await minio.presignedGetObject(BUCKET, objectKey, PRESIGN_SECS)
    res.status(201).json({ ...rows[0], download_url, checklist_item_id: checklistItemId || null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao guardar metadados' })
  }
})

// DELETE /documents/:id
app.delete('/documents/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM process_documents WHERE id = $1 RETURNING minio_object_key`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Documento não encontrado' })
    await minio.removeObject(BUCKET, rows[0].minio_object_key)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao eliminar documento' })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.DOCS_API_PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀  docs API → http://localhost:${PORT}`)
})
