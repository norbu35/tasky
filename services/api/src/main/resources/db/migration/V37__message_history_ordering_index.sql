CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent_at_id
    ON messages (conversation_id, sent_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_messages_flagged_sent_at_id
    ON messages (phone_number_flagged, sent_at DESC, id DESC)
    WHERE phone_number_flagged = true;
