-- ============================================
-- Banco Sol -- Database Seed File
-- Run this file in pgAdmin Query Tool
-- or via: psql -U postgres -d camunda -f database-seed.sql
-- ============================================

-- --------------------------------------------
-- Bank Accounts
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS bank_accounts (
                                             id SERIAL PRIMARY KEY,
                                             account_number VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    centro_negocios VARCHAR(100) NOT NULL
    );

INSERT INTO bank_accounts (account_number, nome, centro_negocios) VALUES
                                                                      ('ACC001', 'João Manuel Silva', 'Agência Luanda Centro'),
                                                                      ('ACC002', 'Maria Fernanda Costa', 'Agência Talatona')
    ON CONFLICT (account_number) DO NOTHING;

-- --------------------------------------------
-- Account NIFs
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS account_nifs (
                                            id SERIAL PRIMARY KEY,
                                            account_number VARCHAR(20) NOT NULL,
    nif VARCHAR(20) NOT NULL,
    FOREIGN KEY (account_number) REFERENCES bank_accounts(account_number)
    );

INSERT INTO account_nifs (account_number, nif) VALUES
                                                   ('ACC001', '5000123456LA'),
                                                   ('ACC001', '5000789012LA'),
                                                   ('ACC002', '6001234567LA')
    ON CONFLICT DO NOTHING;

-- --------------------------------------------
-- Finalidade
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS finalidade (
                                          id SERIAL PRIMARY KEY,
                                          valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO finalidade (valor, label) VALUES
                                          ('pagamento_servicos', 'Pagamento de Serviços'),
                                          ('importacao_bens', 'Importação de Bens')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Descrição da Finalidade
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS descricao_finalidade (
                                                    id SERIAL PRIMARY KEY,
                                                    valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO descricao_finalidade (valor, label) VALUES
                                                    ('consultoria', 'Consultoria'),
                                                    ('assistencia_tecnica', 'Assistência Técnica')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Detalhe da Finalidade
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS detalhe_finalidade (
                                                  id SERIAL PRIMARY KEY,
                                                  valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO detalhe_finalidade (valor, label) VALUES
                                                  ('contrato_servicos', 'Contrato de Serviços'),
                                                  ('fatura_proforma', 'Fatura Pro-forma')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Objectivo da Operação
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS objetivo_operacao (
                                                 id SERIAL PRIMARY KEY,
                                                 valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO objetivo_operacao (valor, label) VALUES
                                                 ('pagamento_exterior', 'Pagamento ao Exterior'),
                                                 ('transferencia_internacional', 'Transferência Internacional')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Cobertura Cambial
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS cobertura_cambial (
                                                 id SERIAL PRIMARY KEY,
                                                 valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO cobertura_cambial (valor, label) VALUES
                                                 ('cobertura_total', 'Cobertura Total'),
                                                 ('cobertura_parcial', 'Cobertura Parcial')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Despesas
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS despesas (
                                        id SERIAL PRIMARY KEY,
                                        valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO despesas (valor, label) VALUES
                                        ('sha', 'SHA - Partilhadas'),
                                        ('our', 'OUR - Ordenante')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Moeda (with priority for top 3)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS moeda (
                                     id SERIAL PRIMARY KEY,
                                     valor VARCHAR(10) UNIQUE NOT NULL,
    label VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 99
    );

INSERT INTO moeda (valor, label, priority) VALUES
                                               ('USD', 'Dólar Americano (USD)', 1),
                                               ('EUR', 'Euro (EUR)', 2),
                                               ('AOA', 'Kwanza Angolano (AOA)', 3),
                                               ('GBP', 'Libra Esterlina (GBP)', 99),
                                               ('CNY', 'Yuan Chinês (CNY)', 99),
                                               ('BRL', 'Real Brasileiro (BRL)', 99),
                                               ('ZAR', 'Rand Sul-Africano (ZAR)', 99),
                                               ('CHF', 'Franco Suíço (CHF)', 99),
                                               ('JPY', 'Iene Japonês (JPY)', 99)
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- País Destino (with priority for top 3)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS pais_destino (
                                            id SERIAL PRIMARY KEY,
                                            valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 99
    );

INSERT INTO pais_destino (valor, label, priority) VALUES
                                                      ('portugal', 'Portugal', 1),
                                                      ('estados_unidos', 'Estados Unidos', 2),
                                                      ('china', 'China', 3),
                                                      ('africa_sul', 'África do Sul', 99),
                                                      ('alemanha', 'Alemanha', 99),
                                                      ('brasil', 'Brasil', 99),
                                                      ('emirados', 'Emirados Árabes Unidos', 99),
                                                      ('franca', 'França', 99),
                                                      ('reino_unido', 'Reino Unido', 99),
                                                      ('suica', 'Suíça', 99)
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Instrumento de Pagamento
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS instrumento_pagamento (
                                                     id SERIAL PRIMARY KEY,
                                                     valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO instrumento_pagamento (valor, label) VALUES
                                                     ('transferencia_bancaria', 'Transferência Bancária'),
                                                     ('carta_credito', 'Carta de Crédito')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Residência Cambial
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS residencia_cambial (
                                                  id SERIAL PRIMARY KEY,
                                                  valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO residencia_cambial (valor, label) VALUES
                                                  ('residente', 'Residente'),
                                                  ('nao_residente', 'Não Residente')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- CAE
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS cae (
                                   id SERIAL PRIMARY KEY,
                                   valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO cae (valor, label) VALUES
                                   ('cae_6201', 'CAE 6201 - Desenvolvimento de Software'),
                                   ('cae_6920', 'CAE 6920 - Contabilidade e Auditoria')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Entidade Petrolifera
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS entidade_petrolifera (
                                                    id SERIAL PRIMARY KEY,
                                                    valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO entidade_petrolifera (valor, label) VALUES
                                                    ('sonangol', 'Sonangol'),
                                                    ('nao_aplicavel', 'Não Aplicável')
    ON CONFLICT (valor) DO NOTHING;

-- --------------------------------------------
-- Banco Beneficiário (Referência Swift)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS banco_beneficiario (
                                                  id SERIAL PRIMARY KEY,
                                                  valor VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL
    );

INSERT INTO banco_beneficiario (valor, label) VALUES
                                                  ('cgd', 'Caixa Geral de Depósitos - CGDIPTPL'),
                                                  ('bpi', 'Banco BPI - BPIPPTPL'),
                                                  ('millennium', 'Millennium BCP - BCOMPTPL')
    ON CONFLICT (valor) DO NOTHING;