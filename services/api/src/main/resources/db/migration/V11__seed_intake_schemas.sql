-- V11__seed_intake_schemas.sql
-- Seed intake schemas for Phase 0-1 launch categories.
-- Activates version 1 schemas for Cleaning, Moving & Hauling, and Handyman.

-- ============================================================
-- 1. Cleaning
-- ============================================================
INSERT INTO category_schema_versions (category_id, version, schema_json, status, is_last_known_good, activated_at)
SELECT id, 1,
    '[{"key":"property_type","label":"Property type","type":"single_select","required":true,"options":["Apartment","Ger","Office","House"]},{"key":"size_or_rooms","label":"Number of rooms","type":"numeric_counter","required":true,"min":1,"max":10},{"key":"cleaning_type","label":"Cleaning type","type":"single_select","required":true,"options":["Standard","Deep Clean","Move-in/Move-out","Post-Renovation"]},{"key":"supplies_provided","label":"Supplies provided by customer","type":"yes_no","required":true}]'::jsonb,
    'ACTIVE', true, now()
FROM categories WHERE name = 'Cleaning';

UPDATE categories SET
    intake_schema_version = 1,
    intake_schema_json    = (SELECT schema_json FROM category_schema_versions csv WHERE csv.category_id = categories.id AND csv.version = 1),
    intake_enabled        = true
WHERE name = 'Cleaning';

-- ============================================================
-- 2. Moving & Hauling
-- ============================================================
INSERT INTO category_schema_versions (category_id, version, schema_json, status, is_last_known_good, activated_at)
SELECT id, 1,
    '[{"key":"moving_scope","label":"Moving scope","type":"multi_select","required":true,"options":["A few items","1-2 room apartment","3+ room apartment","Office"]},{"key":"origin_floor","label":"Origin floor access","type":"single_select","required":true,"options":["Ground","2nd-4th (no elevator)","5+ (no elevator)","Freight elevator","Passenger elevator"]},{"key":"destination_floor","label":"Destination floor access","type":"single_select","required":true,"options":["Ground","2nd-4th (no elevator)","5+ (no elevator)","Freight elevator","Passenger elevator"]},{"key":"heavy_lifting","label":"Heavy lifting required","type":"yes_no","required":true}]'::jsonb,
    'ACTIVE', true, now()
FROM categories WHERE name = 'Moving & Hauling';

UPDATE categories SET
    intake_schema_version = 1,
    intake_schema_json    = (SELECT schema_json FROM category_schema_versions csv WHERE csv.category_id = categories.id AND csv.version = 1),
    intake_enabled        = true
WHERE name = 'Moving & Hauling';

-- ============================================================
-- 3. Handyman
-- ============================================================
INSERT INTO category_schema_versions (category_id, version, schema_json, status, is_last_known_good, activated_at)
SELECT id, 1,
    '[{"key":"issue_type","label":"Type of work","type":"single_select","required":true,"options":["Furniture assembly","Wall repair","Door/window fix","Shelving/mounting","Other"]},{"key":"tools_needed","label":"Special tools needed","type":"yes_no","required":true},{"key":"estimated_hours","label":"Estimated hours","type":"numeric_counter","required":true,"min":1,"max":8}]'::jsonb,
    'ACTIVE', true, now()
FROM categories WHERE name = 'Handyman';

UPDATE categories SET
    intake_schema_version = 1,
    intake_schema_json    = (SELECT schema_json FROM category_schema_versions csv WHERE csv.category_id = categories.id AND csv.version = 1),
    intake_enabled        = true
WHERE name = 'Handyman';
