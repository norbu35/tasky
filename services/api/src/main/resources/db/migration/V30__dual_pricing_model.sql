-- Dual pricing model: REQ-P1-PRICE-01 through REQ-P1-PRICE-08.
-- Tasks support BUDGET (customer sets price) and QUOTE (taskers bid) modes.
ALTER TABLE tasks ADD COLUMN pricing_mode TEXT NOT NULL DEFAULT 'BUDGET'
    CHECK (pricing_mode IN ('BUDGET', 'QUOTE'));

-- Budget becomes nullable for QUOTE-mode tasks.
ALTER TABLE tasks ALTER COLUMN budget DROP NOT NULL;

-- Taskers submit a quote price as part of their application.
-- For BUDGET tasks this is a counter-offer; for QUOTE tasks this is the primary price.
ALTER TABLE task_applications ADD COLUMN quote_price INT;
