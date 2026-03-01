CREATE INDEX IF NOT EXISTS idx_tasks_status_created_at_id
    ON tasks (status, created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_tasks_customer_status_created_at_id
    ON tasks (customer_id, status, created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_task_applications_task_status_created_at
    ON task_applications (task_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_status_updated_at
    ON bookings (customer_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_tasker_status_updated_at
    ON bookings (tasker_id, status, updated_at DESC);
