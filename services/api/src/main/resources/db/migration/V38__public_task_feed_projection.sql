CREATE VIEW public_task_feed_projection AS
SELECT t.id,
       c.id AS category_id,
       c.name AS category_name,
       c.name_mn AS category_name_mn,
       c.icon_url AS category_icon_url,
       t.description,
       t.budget,
       t.pricing_mode,
       COALESCE(d.name || ', Ulaanbaatar', 'Ulaanbaatar') AS approximate_location,
       COALESCE(d.centroid_lat, 47.9184) AS approximate_lat,
       COALESCE(d.centroid_lng, 106.9177) AS approximate_lng,
       t.status,
       t.scheduled_at,
       t.created_at,
       t.location_point AS task_location_point
FROM tasks t
         JOIN categories c ON c.id = t.category_id
         LEFT JOIN LATERAL (
             SELECT district.name,
                    district.centroid_lat,
                    district.centroid_lng
             FROM districts district
             WHERE district.is_active = true
               AND district.centroid_lat IS NOT NULL
               AND district.centroid_lng IS NOT NULL
             ORDER BY t.location_point <-> ST_SetSRID(ST_MakePoint(district.centroid_lng, district.centroid_lat), 4326)
             LIMIT 1
         ) d ON true
WHERE t.status = 'OPEN';
