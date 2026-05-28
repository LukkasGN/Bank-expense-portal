-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
                                             id SERIAL PRIMARY KEY,
                                             account_number VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    centro_negocios VARCHAR(100) NOT NULL
    );

-- Account NIFs
CREATE TABLE IF NOT EXISTS account_nifs (
                                            id SERIAL PRIMARY KEY,
                                            account_number VARCHAR(20) NOT NULL,
    nif VARCHAR(20) NOT NULL,
    FOREIGN KEY (account_number) REFERENCES bank_accounts(account_number)
    );

-- Demo data
INSERT INTO bank_accounts (account_number, nome, centro_negocios) VALUES
                                                                      ('ACC001', 'João Manuel Silva', 'Agência Luanda Centro'),
                                                                      ('ACC002', 'Maria Fernanda Costa', 'Agência Talatona')
    ON CONFLICT (account_number) DO NOTHING;

INSERT INTO account_nifs (account_number, nif) VALUES
                                                   ('ACC001', '5000123456LA'),
                                                   ('ACC001', '5000789012LA'),
                                                   ('ACC002', '6001234567LA')
    ON CONFLICT DO NOTHING;