ALTER TABLE events
ADD COLUMN IF NOT EXISTS unbooked_notification_sent_at TIMESTAMP;
