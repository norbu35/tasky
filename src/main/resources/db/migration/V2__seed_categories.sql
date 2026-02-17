-- V2__seed_categories.sql
-- Seed 12 categories for the Mongolian market

INSERT INTO categories (id, name, name_mn, icon_url, is_active, sort_order) VALUES
  (gen_random_uuid(), 'Cleaning',            'Цэвэрлэгээ',              'https://img.tasky.mn/cat/cleaning.svg',            true,  1),
  (gen_random_uuid(), 'Plumbing',            'Сантехник',                'https://img.tasky.mn/cat/plumbing.svg',            true,  2),
  (gen_random_uuid(), 'Electrical',          'Цахилгааны засвар',        'https://img.tasky.mn/cat/electrical.svg',          true,  3),
  (gen_random_uuid(), 'Moving & Hauling',    'Зөөвөрлөлт',              'https://img.tasky.mn/cat/moving.svg',              true,  4),
  (gen_random_uuid(), 'Heating & HVAC',      'Халаалт, агааржуулалт',    'https://img.tasky.mn/cat/heating.svg',             true,  5),
  (gen_random_uuid(), 'Painting',            'Будаг, ханын цаас',        'https://img.tasky.mn/cat/painting.svg',            true,  6),
  (gen_random_uuid(), 'Furniture Assembly',  'Тавилга угсралт',          'https://img.tasky.mn/cat/furniture.svg',           true,  7),
  (gen_random_uuid(), 'Appliance Repair',    'Гэр ахуйн техник засвар',  'https://img.tasky.mn/cat/appliance.svg',           true,  8),
  (gen_random_uuid(), 'Handyman',            'Гар ажил',                 'https://img.tasky.mn/cat/handyman.svg',            true,  9),
  (gen_random_uuid(), 'Carpentry & Doors',   'Мужааны ажил',             'https://img.tasky.mn/cat/carpentry.svg',           true, 10),
  (gen_random_uuid(), 'Flooring & Tiling',   'Шал, хавтангийн ажил',     'https://img.tasky.mn/cat/flooring.svg',            true, 11),
  (gen_random_uuid(), 'Delivery & Errands',  'Хүргэлт, туслах ажил',     'https://img.tasky.mn/cat/delivery.svg',            true, 12);
