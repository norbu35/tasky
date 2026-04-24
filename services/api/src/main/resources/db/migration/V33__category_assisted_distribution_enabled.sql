-- Admin launch control for task-level assisted distribution.
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS assisted_distribution_enabled BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE categories
SET assisted_distribution_enabled = TRUE
WHERE lower(name) IN (
    'home cleaning',
    'cleaning',
    'furniture assembly',
    'moving help',
    'moving help / lifting help',
    'moving & hauling',
    'minor handyman',
    'handyman'
);
