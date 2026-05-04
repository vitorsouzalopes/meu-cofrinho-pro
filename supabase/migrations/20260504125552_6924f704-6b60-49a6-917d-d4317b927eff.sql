ALTER TABLE public.telegram_config 
ADD COLUMN IF NOT EXISTS reminder_hour integer NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS streak_reminders_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS event_notifications_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.telegram_config 
ADD CONSTRAINT reminder_hour_range CHECK (reminder_hour >= 0 AND reminder_hour <= 23);