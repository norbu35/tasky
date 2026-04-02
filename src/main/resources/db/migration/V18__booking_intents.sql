CREATE TABLE booking_intents (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tasker_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    source TEXT NOT NULL CHECK (source IN ('REBOOK', 'INSTANT_MATCH')),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED')),
    original_booking_id UUID NULL REFERENCES bookings(id),
    offer_id UUID NULL,
    expires_at TIMESTAMPTZ NULL,
    confirmed_booking_id UUID NULL REFERENCES bookings(id),
    confirmed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_intents_task_id ON booking_intents(task_id);
CREATE INDEX idx_booking_intents_customer_id ON booking_intents(customer_id);
CREATE INDEX idx_booking_intents_status ON booking_intents(status);
