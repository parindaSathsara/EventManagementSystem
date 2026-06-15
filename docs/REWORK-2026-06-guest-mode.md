# Rework 2026-06 · Guest mode (login bypass)

**Date:** 2026-06-14
**Why:** The app pivots to an edmcalendar.lk-style experience where *everyone
browses as a guest*. Only event managers (who double as artists) log in to add
events. Nothing in the old auth flow was deleted — it is **dormant and
reversible**.

## What changed

- **Boot flow** (`Project/App.js`): the default stage is now `guest`
  (`GuestTabs`). `SplashScreen.onFinish` drops into `guest` instead of
  `welcome`. On session restore, a returning **manager** (`role` = `artist` or
  `admin`) resumes in the publishing app; anyone else lands in `guest`.
- **Manager login entry**: discreet key icon (🔑) in the Events header and the
  Notifications header → `App.js` sets stage `login`. The full
  `login → completeProfile → roleSelect → artist` flow is unchanged.
- **Logout** now returns to `guest` (was `welcome`).
- **Role chooser**: `onPickCustomer` now routes to `guest` (was `customer`).

## Dormant (kept, not reachable from the guest-first boot)

| Screen / stage | File | Status |
| --- | --- | --- |
| `WelcomeScreen` (`welcome` stage) | `src/features/auth/screens/WelcomeScreen.jsx` | rendered only if `stage==='welcome'`, which is no longer set |
| `CustomerTabs` (`customer` stage) | `src/navigation/CustomerTabs.jsx` | preserved; rendered only if `stage==='customer'` |

These are intentionally left in place so we can restore the original
login-gated, customer-centric experience later.

## How to restore the old login-gated flow

1. In `Project/App.js`:
   - `SplashScreen onFinish={() => setStage('welcome')}`.
   - In the boot `restoreSession` effect, route restored users to
     `roleSelect/completeProfile` regardless of role (drop the `isManager`
     branch).
   - `handleLogout` → `setStage('welcome')`.
   - `RoleSelectScreen onPickCustomer={() => setStage('customer')}`.
   - Make the default `return` render `CustomerTabs` again (or keep `GuestTabs`
     as an additional tab set).
2. No backend changes are required — guest reads were always allowed via
   `optionalAuth`.

## Related docs

- `REWORK-2026-06-navigation.md`
- `REWORK-2026-06-schema.md`
