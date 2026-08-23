/**
 * Background push sweep.
 *
 * Runs in-process on a plain interval rather than pulling in a cron/queue
 * dependency: events-ai is one pm2 instance sharing a container with several
 * other apps, and every job here is idempotent (the delivery ledger dedupes),
 * so the worst case of a double run is a wasted query. If this ever runs
 * clustered, set PUSH_SCHEDULER_ENABLED=false on all but one instance.
 *
 * Each tick:
 *   1. announce events published while we were down (deploys, restarts)
 *   2. inside the reminder window, send T-minus reminders to quiet installs
 *   3. resolve push receipts and retire dead tokens
 *   4. prune the delivery ledger (hourly-ish, not every tick)
 */

const config = require('../../config');
const service = require('./service');

let timer = null;
let running = false;
let lastPruneAt = 0;

const PRUNE_INTERVAL_MS = 6 * 3600 * 1000;

function log(...args) {
  // eslint-disable-next-line no-console
  console.log('[push:scheduler]', ...args);
}

/**
 * Local wall-clock hour for the audience (Asia/Colombo by default). The box
 * runs UTC; shifting by a fixed offset beats a tz database for one comparison,
 * and Sri Lanka has no DST to get wrong.
 */
function localHour(now = new Date()) {
  const shifted = new Date(now.getTime() + config.push.tzOffsetMinutes * 60 * 1000);
  return shifted.getUTCHours();
}

/**
 * True inside the once-a-day reminder window. The window is a whole hour and
 * the sweep runs every few minutes, so a device that registers mid-morning
 * still gets today's reminder — the dedupe key keeps it to one.
 */
function inReminderWindow(now = new Date()) {
  return localHour(now) === config.push.reminderHour;
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const publishes = await service.dispatchPendingPublishes();
    if (publishes.sent) log('catch-up announcements:', publishes.sent);

    if (inReminderWindow()) {
      const reminders = await service.dispatchReminders();
      if (reminders.sent) log('reminders:', reminders.sent);
    }

    const receipts = await service.checkReceipts();
    if (receipts.retired) log('retired dead tokens:', receipts.retired);

    if (Date.now() - lastPruneAt > PRUNE_INTERVAL_MS) {
      lastPruneAt = Date.now();
      const pruned = await service.pruneDeliveries();
      if (pruned.pruned) log('pruned delivery rows:', pruned.pruned);
    }
  } catch (err) {
    log('tick failed:', err.message);
  } finally {
    running = false;
  }
}

function start() {
  if (timer) return timer;
  if (!config.push.enabled || !config.push.schedulerEnabled) {
    log('disabled');
    return null;
  }
  log(
    `every ${Math.round(config.push.sweepIntervalMs / 1000)}s · reminders at ` +
      `${config.push.reminderHour}:00 (UTC${config.push.tzOffsetMinutes >= 0 ? '+' : ''}` +
      `${config.push.tzOffsetMinutes / 60}) · lead times T-${config.push.reminderDays.join(', T-')}`,
  );
  // Let the process finish booting (Prisma connect, listener up) before the
  // first sweep touches the DB.
  setTimeout(tick, 15_000).unref();
  timer = setInterval(tick, config.push.sweepIntervalMs);
  timer.unref();
  return timer;
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop, tick, inReminderWindow, localHour };
