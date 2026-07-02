CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    service_type TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'yangi'
);

CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cert_number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    sample_type TEXT NOT NULL,
    standard_ref TEXT,
    test_date DATE NOT NULL,
    result_summary TEXT,
    status TEXT NOT NULL DEFAULT 'kutilmoqda'
);

CREATE INDEX IF NOT EXISTS idx_test_results_cert ON test_results (cert_number);
