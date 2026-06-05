-- db/migration.sql
-- Run once against your existing PostgreSQL database, then you can delete this file.
--
--   psql -U your_user -d your_database -f db/migration.sql

CREATE TABLE IF NOT EXISTS document_checklist (
    id              SERIAL PRIMARY KEY,
    process_key     VARCHAR(255) NOT NULL,
    document_name   VARCHAR(255) NOT NULL,
    document_type   VARCHAR(100) NOT NULL,
    required        BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS process_documents (
    id                  SERIAL PRIMARY KEY,
    process_instance_id VARCHAR(255) NOT NULL,
    process_key         VARCHAR(255),
    checklist_item_id   INTEGER REFERENCES document_checklist(id) ON DELETE SET NULL,
    file_name           VARCHAR(512) NOT NULL,
    minio_bucket        VARCHAR(255) NOT NULL DEFAULT 'documents',
    minio_object_key    VARCHAR(1024) NOT NULL,
    content_type        VARCHAR(100),
    file_size_bytes     BIGINT,
    author              VARCHAR(255),
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_process_docs_instance
    ON process_documents(process_instance_id);

INSERT INTO document_checklist (process_key, document_name, document_type, required)
VALUES
    ('processo_operacao_cambial', 'Cartão de Cidadão',               'Identificação', true),
    ('processo_operacao_cambial', 'Comprovativo de Morada',          'Residência',    true),
    ('processo_operacao_cambial', 'Últimos 3 Recibos de Vencimento', 'Rendimento',    true),
    ('processo_operacao_cambial', 'Declaração de IRS',               'Fiscal',        false)
ON CONFLICT DO NOTHING;
