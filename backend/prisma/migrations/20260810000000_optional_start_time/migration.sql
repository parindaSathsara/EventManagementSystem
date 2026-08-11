-- Optional start time (client feedback 2026-08-10): an organizer can announce
-- the DAY of an event before the time is locked. When `startTimeTba` is true
-- the app shows "Time revealed soon" and `startsAt` holds that day at noon
-- (with `endsAt` at end of day), so the event still sorts and groups on the
-- correct date and never reads as "ended" while the day is still running.
--
-- Existing rows keep a real, announced time — hence the false default.
ALTER TABLE `Event` ADD COLUMN `startTimeTba` BOOLEAN NOT NULL DEFAULT false;
