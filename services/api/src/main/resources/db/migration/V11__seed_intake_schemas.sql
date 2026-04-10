-- V11__seed_intake_schemas.sql
-- Seed intake schemas for Phase 0-1 launch categories.
-- Activates version 1 schemas for Cleaning, Moving & Hauling, and Handyman.
-- Options use structured {value, label, label_mn} format for bilingual support.

-- ============================================================
-- 1. Cleaning
-- ============================================================
INSERT INTO category_schema_versions (category_id, version, schema_json, status, activated_at)
SELECT id, 1,
    '[{"key":"property_type","label":"Property type","label_mn":"Байрны төрөл","type":"single_select","required":true,"options":[{"value":"apartment","label":"Apartment","label_mn":"Орон сууц"},{"value":"ger","label":"Ger","label_mn":"Гэр"},{"value":"office","label":"Office","label_mn":"Оффис"},{"value":"house","label":"House","label_mn":"Байшин"}]},{"key":"size_or_rooms","label":"Number of rooms","label_mn":"Өрөөний тоо","type":"numeric_counter","required":true,"min":1,"max":10},{"key":"cleaning_type","label":"Cleaning type","label_mn":"Цэвэрлэгээний төрөл","type":"single_select","required":true,"options":[{"value":"standard","label":"Standard","label_mn":"Стандарт"},{"value":"deep_clean","label":"Deep Clean","label_mn":"Гүнзгий цэвэрлэгээ"},{"value":"move_in_move_out","label":"Move-in/Move-out","label_mn":"Нүүлт цэвэрлэгээ"},{"value":"post_renovation","label":"Post-Renovation","label_mn":"Засварын дараах цэвэрлэгээ"}]},{"key":"supplies_provided","label":"Supplies provided by customer","label_mn":"Хэрэглэгч тоног хэрэгсэл авчрах","type":"yes_no","required":true}]'::jsonb,
    'ACTIVE', now()
FROM categories WHERE name = 'Cleaning';

UPDATE categories SET
    intake_schema_version = 1,
    intake_schema_json    = (SELECT schema_json FROM category_schema_versions csv WHERE csv.category_id = categories.id AND csv.version = 1),
    intake_enabled        = true
WHERE name = 'Cleaning';

-- ============================================================
-- 2. Moving & Hauling
-- ============================================================
INSERT INTO category_schema_versions (category_id, version, schema_json, status, activated_at)
SELECT id, 1,
    '[{"key":"moving_scope","label":"Moving scope","label_mn":"Нүүлтийн хэмжээ","type":"multi_select","required":true,"options":[{"value":"few_items","label":"A few items","label_mn":"Хэдхэн эд зүйл"},{"value":"1_2_room_apartment","label":"1-2 room apartment","label_mn":"1-2 өрөөт орон сууц"},{"value":"3_plus_room_apartment","label":"3+ room apartment","label_mn":"3+ өрөөт орон сууц"},{"value":"office","label":"Office","label_mn":"Оффис"}]},{"key":"origin_floor","label":"Origin floor access","label_mn":"Гарах давхрын нэвтрэлт","type":"single_select","required":true,"options":[{"value":"ground","label":"Ground","label_mn":"1-р давхар"},{"value":"2nd_4th_no_elevator","label":"2nd-4th (no elevator)","label_mn":"2-4-р давхар (лифтгүй)"},{"value":"5_plus_no_elevator","label":"5+ (no elevator)","label_mn":"5+ давхар (лифтгүй)"},{"value":"freight_elevator","label":"Freight elevator","label_mn":"Ачааны лифт"},{"value":"passenger_elevator","label":"Passenger elevator","label_mn":"Зорчигчийн лифт"}]},{"key":"destination_floor","label":"Destination floor access","label_mn":"Очих давхрын нэвтрэлт","type":"single_select","required":true,"options":[{"value":"ground","label":"Ground","label_mn":"1-р давхар"},{"value":"2nd_4th_no_elevator","label":"2nd-4th (no elevator)","label_mn":"2-4-р давхар (лифтгүй)"},{"value":"5_plus_no_elevator","label":"5+ (no elevator)","label_mn":"5+ давхар (лифтгүй)"},{"value":"freight_elevator","label":"Freight elevator","label_mn":"Ачааны лифт"},{"value":"passenger_elevator","label":"Passenger elevator","label_mn":"Зорчигчийн лифт"}]},{"key":"heavy_lifting","label":"Heavy lifting required","label_mn":"Хүнд зүйл зөөх шаардлагатай","type":"yes_no","required":true}]'::jsonb,
    'ACTIVE', now()
FROM categories WHERE name = 'Moving & Hauling';

UPDATE categories SET
    intake_schema_version = 1,
    intake_schema_json    = (SELECT schema_json FROM category_schema_versions csv WHERE csv.category_id = categories.id AND csv.version = 1),
    intake_enabled        = true
WHERE name = 'Moving & Hauling';

-- ============================================================
-- 3. Handyman
-- ============================================================
INSERT INTO category_schema_versions (category_id, version, schema_json, status, activated_at)
SELECT id, 1,
    '[{"key":"issue_type","label":"Type of work","label_mn":"Ажлын төрөл","type":"single_select","required":true,"options":[{"value":"furniture_assembly","label":"Furniture assembly","label_mn":"Тавилга угсралт"},{"value":"wall_repair","label":"Wall repair","label_mn":"Хана засвар"},{"value":"door_window_fix","label":"Door/window fix","label_mn":"Хаалга/цонх засвар"},{"value":"shelving_mounting","label":"Shelving/mounting","label_mn":"Тавиур/суурилуулалт"},{"value":"other","label":"Other","label_mn":"Бусад"}]},{"key":"tools_needed","label":"Special tools needed","label_mn":"Тусгай хэрэгсэл шаардлагатай","type":"yes_no","required":true},{"key":"estimated_hours","label":"Estimated hours","label_mn":"Тооцоолсон цаг","type":"numeric_counter","required":true,"min":1,"max":8}]'::jsonb,
    'ACTIVE', now()
FROM categories WHERE name = 'Handyman';

UPDATE categories SET
    intake_schema_version = 1,
    intake_schema_json    = (SELECT schema_json FROM category_schema_versions csv WHERE csv.category_id = categories.id AND csv.version = 1),
    intake_enabled        = true
WHERE name = 'Handyman';
