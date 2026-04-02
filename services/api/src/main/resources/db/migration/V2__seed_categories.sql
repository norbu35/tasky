-- V2__seed_categories.sql
-- Seed 12 categories for the Mongolian market

INSERT INTO categories (id, name, name_mn, icon_url, is_active, sort_order)
VALUES (gen_random_uuid(), 'Cleaning', 'Цэвэрлэгээ', 'https://img.tasky.mn/cat/cleaning.svg', TRUE, 1)
     , (gen_random_uuid(), 'Plumbing', 'Сантехник', 'https://img.tasky.mn/cat/plumbing.svg', TRUE, 2)
     , (gen_random_uuid(), 'Electrical', 'Цахилгааны засвар', 'https://img.tasky.mn/cat/electrical.svg', TRUE, 3)
     , (gen_random_uuid(), 'Moving & Hauling', 'Зөөвөрлөлт', 'https://img.tasky.mn/cat/moving.svg', TRUE, 4)
     , (gen_random_uuid(), 'Heating & HVAC', 'Халаалт, агааржуулалт', 'https://img.tasky.mn/cat/heating.svg', TRUE, 5)
     , (gen_random_uuid(), 'Painting', 'Будаг, ханын цаас', 'https://img.tasky.mn/cat/painting.svg', TRUE, 6)
     , (gen_random_uuid(), 'Furniture Assembly', 'Тавилга угсралт', 'https://img.tasky.mn/cat/furniture.svg', TRUE, 7)
     , (gen_random_uuid(), 'Appliance Repair', 'Гэр ахуйн техник засвар', 'https://img.tasky.mn/cat/appliance.svg',
        TRUE, 8)
     , (gen_random_uuid(), 'Handyman', 'Гар ажил', 'https://img.tasky.mn/cat/handyman.svg', TRUE, 9)
     , (gen_random_uuid(), 'Carpentry & Doors', 'Мужааны ажил', 'https://img.tasky.mn/cat/carpentry.svg', TRUE, 10)
     , (gen_random_uuid(), 'Flooring & Tiling', 'Шал, хавтангийн ажил', 'https://img.tasky.mn/cat/flooring.svg', TRUE,
        11)
     , (gen_random_uuid(), 'Delivery & Errands', 'Хүргэлт, туслах ажил', 'https://img.tasky.mn/cat/delivery.svg', TRUE,
        12);
