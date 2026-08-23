/**
 * Expo Push Notification Service client.
 *
 * Talks to https://exp.host directly over `fetch` (Node 20 global) — no SDK
 * dependency, because the wire protocol is two JSON endpoints:
 *
 *   POST /--/api/v2/push/send        → tickets   (accepted / rejected now)
 *   POST /--/api/v2/push/getReceipts → receipts  (actually delivered?)
 *
 * The two-phase design matters: a token that FCM has retired usually still
 * gets an "ok" ticket and only fails minutes later in the receipt, so pruning
 * dead devices requires reading receipts, not just tickets.
 *
 * Everything here is transport. Audience, dedupe, and copy live in
 * modules/notifications/.
 */

const config = require('../config');

const SEND_URL = 'https://exp.host/--/api/v2/push/send';
const RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

// Expo's documented limits: 100 messages per send call, 1000 ids per receipt
// call. Going over either is a hard 400.
const SEND_CHUNK = 100;
const RECEIPT_CHUNK = 1000;

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/** `ExponentPushToken[xxx]` / `ExpoPushToken[xxx]` — anything else is junk. */
function isExpoPushToken(token) {
  return typeof token === 'string' && /^Expo(nent)?PushToken\[[^\][\s]+\]$/.test(token);
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function headers() {
  const h = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
  // Only needed once "enhanced push security" is switched on for the Expo
  // account, but harmless (and forward-proof) to always send when present.
  if (config.push.accessToken) h.Authorization = `Bearer ${config.push.accessToken}`;
  return h;
}

/**
 * POST with a timeout and a small retry budget for the transient statuses.
 * Returns the parsed body, or throws the last error.
 */
async function postJson(url, body, { attempts = 3 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.push.requestTimeoutMs),
      });

      if (RETRYABLE_STATUS.has(res.status) && attempt < attempts) {
        await sleep(500 * 2 ** (attempt - 1));
        continue;
      }

      const text = await res.text();
      let payload = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { raw: text };
        }
      }

      if (!res.ok) {
        const msg =
          payload?.errors?.[0]?.message || payload?.raw || `Expo push failed (${res.status})`;
        throw new Error(msg);
      }
      return payload;
    } catch (err) {
      lastErr = err;
      // AbortError / ECONNRESET — worth one more go.
      if (attempt < attempts) {
        await sleep(500 * 2 ** (attempt - 1));
        continue;
      }
    }
  }
  throw lastErr || new Error('Expo push failed');
}

/**
 * Send a batch of messages.
 *
 * @param {Array<object>} messages Expo message objects; each MUST carry `to`.
 * @returns {Promise<Array<{ message, status, id?, error?, details? }>>}
 *   One result per input message, in the same order. `status` is
 *   'ok' | 'error'; `error` is Expo's machine code
 *   (DeviceNotRegistered / MessageTooBig / MessageRateExceeded / MismatchSenderId
 *   / InvalidCredentials) when the ticket was rejected outright.
 */
async function sendPushMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) return [];

  const results = new Array(messages.length);
  const batches = chunk(
    messages.map((message, index) => ({ message, index })),
    SEND_CHUNK,
  );

  for (const batch of batches) {
    let tickets;
    try {
      const payload = await postJson(
        SEND_URL,
        batch.map((b) => b.message),
      );
      tickets = Array.isArray(payload?.data) ? payload.data : [];
    } catch (err) {
      // Whole-batch failure (network, auth, Expo outage). Mark every message
      // in it as failed but keep going — the next batch may well succeed.
      batch.forEach(({ message, index }) => {
        results[index] = { message, status: 'error', error: 'TransportError', details: err.message };
      });
      continue;
    }

    batch.forEach(({ message, index }, i) => {
      const ticket = tickets[i];
      if (!ticket) {
        results[index] = { message, status: 'error', error: 'NoTicket' };
        return;
      }
      results[index] =
        ticket.status === 'ok'
          ? { message, status: 'ok', id: ticket.id }
          : {
              message,
              status: 'error',
              error: ticket.details?.error || 'PushError',
              details: ticket.message,
            };
    });
  }

  return results;
}

/**
 * Resolve push receipts for previously issued ticket ids.
 *
 * @param {string[]} ticketIds
 * @returns {Promise<Map<string, { status, error?, details? }>>}
 *   Ids missing from the map simply aren't ready yet — Expo keeps receipts
 *   for 24h, so an absent id is "check again later", never "delivered".
 */
async function getPushReceipts(ticketIds) {
  const out = new Map();
  const ids = (ticketIds || []).filter(Boolean);
  if (!ids.length) return out;

  for (const batch of chunk(ids, RECEIPT_CHUNK)) {
    let data;
    try {
      const payload = await postJson(RECEIPTS_URL, { ids: batch });
      data = payload?.data || {};
    } catch {
      // Receipts are best-effort housekeeping; a failure here just delays
      // pruning to the next sweep.
      continue;
    }
    for (const [id, receipt] of Object.entries(data)) {
      out.set(id, {
        status: receipt?.status,
        error: receipt?.details?.error,
        details: receipt?.message,
      });
    }
  }
  return out;
}

/**
 * Errors that mean "this token will never work again" — the device row should
 * be retired rather than retried. Everything else (rate limits, Expo hiccups)
 * is transient.
 */
function isPermanentTokenError(code) {
  return code === 'DeviceNotRegistered' || code === 'MismatchSenderId';
}

module.exports = {
  isExpoPushToken,
  sendPushMessages,
  getPushReceipts,
  isPermanentTokenError,
};
