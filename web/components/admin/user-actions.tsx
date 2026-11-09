'use client';

import { FormEvent, useCallback, useState } from 'react';
import { CalendarDays, Copy, Crown, Dices, Eye, EyeOff, UserRound } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { type AdminUser, type CreateUserInput, type Role, type UpdateUserInput, adminApi } from '@/lib/admin';
import { ConfirmDialog, Modal } from './ui';

const ROLE_OPTIONS: Array<{ value: Role; title: string; copy: string; icon: React.ReactNode }> = [
  { value: 'artist', title: 'Organizer', copy: 'Event company or artist. Publishes events from the studio and the app.', icon: <CalendarDays size={15} /> },
  { value: 'admin', title: 'Super admin', copy: 'Full console access: every account, event and report.', icon: <Crown size={15} /> },
  { value: 'customer', title: 'Guest account', copy: 'A regular fan account. Can save events and follow.', icon: <UserRound size={15} /> },
];

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function fieldErrors(err: unknown) {
  const out: Record<string, string> = {};
  if (err instanceof ApiError && Array.isArray(err.details)) {
    for (const d of err.details as Array<{ path?: string; message?: string }>) if (d.path) out[d.path] = d.message || 'Invalid';
  }
  return out;
}

function PasswordInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input id={id} className="adm-input adm-num" type={visible ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="adm-btn adm-icon-btn" style={{ height: 40, width: 40 }} onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
      <button type="button" className="adm-btn" style={{ height: 40 }} onClick={() => { onChange(generatePassword()); setVisible(true); }}><Dices size={15} />Generate</button>
    </div>
  );
}

// --- create / edit ----------------------------------------------------------------------

export function UserFormModal({ user, onClose, onSaved }: { user?: AdminUser; onClose: () => void; onSaved: (u: AdminUser, created: boolean) => void }) {
  const editing = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: (user?.role || 'artist') as Role,
    handle: user?.artist?.handle || '',
    category: user?.artist?.category || '',
    isVerified: user?.artist?.isVerified ?? true,
    isPreferred: user?.artist?.isPreferred ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const showOrganizer = form.role === 'artist' || !!user?.artist;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    const organizer = showOrganizer && form.handle.trim()
      ? { handle: form.handle.trim().replace(/^@/, ''), category: form.category.trim() || null, isVerified: form.isVerified, isPreferred: form.isPreferred }
      : null;
    try {
      let saved: AdminUser;
      if (editing && user) {
        const patch: UpdateUserInput = {};
        if (form.name.trim() !== user.name) patch.name = form.name.trim();
        if (form.email.trim().toLowerCase() !== user.email) patch.email = form.email.trim().toLowerCase();
        if ((form.phone.trim() || null) !== (user.phone || null)) patch.phone = form.phone.trim() || null;
        if (form.role !== user.role) patch.role = form.role;
        if (organizer) patch.organizer = organizer;
        if (!Object.keys(patch).length) { onClose(); return; }
        saved = await adminApi.updateUser(user.id, patch);
      } else {
        const input: CreateUserInput = { name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone.trim() || null, role: form.role, organizer };
        saved = await adminApi.createUser(input);
      }
      onSaved(saved, !editing);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={editing ? `Edit ${user?.name}` : 'Create an account'}
      subtitle={editing ? 'Changes apply immediately and are recorded in the activity log.' : 'The new user can sign in straight away with these details — share the password with them securely.'}
      onClose={onClose}
      footer={<>
        <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
        <button type="submit" form="adm-user-form" className="adm-btn adm-btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create account'}</button>
      </>}
    >
      <form id="adm-user-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="adm-field">
          <span className="adm-field-label">Account type</span>
          <div className="adm-role-picker" role="radiogroup" aria-label="Account type">
            {ROLE_OPTIONS.map((o) => (
              <label key={o.value} className={`adm-role-option${form.role === o.value ? ' is-selected' : ''}`}>
                <input type="radio" name="role" value={o.value} checked={form.role === o.value} onChange={() => set({ role: o.value })} />
                <strong>{o.icon}{o.title}</strong>
                <span>{o.copy}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="adm-form-grid">
          <div className="adm-field">
            <label htmlFor="u-name">{form.role === 'artist' ? 'Organizer / company name' : 'Full name'}</label>
            <input id="u-name" className="adm-input" required maxLength={80} value={form.name} onChange={(e) => set({ name: e.target.value })} />
            {errors.name && <span className="adm-field-error">{errors.name}</span>}
          </div>
          <div className="adm-field">
            <label htmlFor="u-email">Email (used to sign in)</label>
            <input id="u-email" className="adm-input" type="email" required value={form.email} onChange={(e) => set({ email: e.target.value })} />
            {errors.email && <span className="adm-field-error">{errors.email}</span>}
          </div>
          <div className="adm-field">
            <label htmlFor="u-phone">Phone <span className="adm-muted">(optional)</span></label>
            <input id="u-phone" className="adm-input" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+94 77 123 4567" />
            {errors.phone && <span className="adm-field-error">{errors.phone}</span>}
          </div>
          {!editing && (
            <div className="adm-field adm-span-2">
              <label htmlFor="u-password">Password</label>
              <PasswordInput id="u-password" value={form.password} onChange={(password) => set({ password })} />
              {errors.password ? <span className="adm-field-error">{errors.password}</span> : <span className="adm-field-hint">At least 8 characters.</span>}
            </div>
          )}
        </div>

        {showOrganizer && (
          <div className="adm-form-grid" style={{ paddingTop: 4, borderTop: '1px solid var(--adm-line)' }}>
            <div className="adm-span-2 adm-field-label" style={{ paddingTop: 12 }}>Organizer profile</div>
            <div className="adm-field">
              <label htmlFor="u-handle">Public handle</label>
              <input id="u-handle" className="adm-input" required={form.role === 'artist'} maxLength={40} value={form.handle} onChange={(e) => set({ handle: e.target.value.replace(/\s+/g, '').toLowerCase() })} placeholder="e.g. pulsecollective" />
              {errors['organizer.handle'] ? <span className="adm-field-error">{errors['organizer.handle']}</span> : <span className="adm-field-hint">Letters, numbers, _ and . only.</span>}
            </div>
            <div className="adm-field">
              <label htmlFor="u-category">Category <span className="adm-muted">(optional)</span></label>
              <input id="u-category" className="adm-input" maxLength={40} value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="Event company, DJ, Band…" />
            </div>
            <label className="adm-check"><input type="checkbox" checked={form.isVerified} onChange={(e) => set({ isVerified: e.target.checked })} /><div><strong>Verified</strong><span>Shows the verified badge on their profile.</span></div></label>
            <label className="adm-check"><input type="checkbox" checked={form.isPreferred} onChange={(e) => set({ isPreferred: e.target.checked })} /><div><strong>Preferred</strong><span>Their reels go live without the approval queue.</span></div></label>
          </div>
        )}
        {error && <div className="adm-notice" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}

// --- reset password ------------------------------------------------------------------------

export function ResetPasswordModal({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await adminApi.resetPassword(user.id, password);
      setDone(true);
      onDone();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={done ? 'Password updated' : `Reset password for ${user.name}`} size="sm" onClose={onClose} subtitle={done ? 'Share it with them securely — it won’t be shown again.' : 'Their current password stops working immediately.'}
      footer={done
        ? <button type="button" className="adm-btn adm-btn-primary" onClick={onClose}>Done</button>
        : <><button type="button" className="adm-btn" onClick={onClose}>Cancel</button><button type="submit" form="adm-reset-form" className="adm-btn adm-btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Set new password'}</button></>}
    >
      {done ? (
        <div className="adm-field">
          <span className="adm-field-label">{user.email}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="adm-input adm-num" readOnly value={password} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="adm-btn" style={{ height: 40 }} onClick={() => navigator.clipboard?.writeText(password)}><Copy size={15} />Copy</button>
          </div>
        </div>
      ) : (
        <form id="adm-reset-form" onSubmit={submit} className="adm-field">
          <label htmlFor="reset-pw">New password</label>
          <PasswordInput id="reset-pw" value={password} onChange={setPassword} />
          {error && <div className="adm-notice" role="alert" style={{ marginTop: 6 }}>{error}</div>}
        </form>
      )}
    </Modal>
  );
}

// --- one hook for every row/detail action -------------------------------------------------------

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: AdminUser }
  | { kind: 'reset'; user: AdminUser }
  | { kind: 'suspend'; user: AdminUser }
  | { kind: 'delete'; user: AdminUser };

export function useUserActions({ onChanged, onDeleted, notify }: {
  onChanged: (user?: AdminUser) => void;
  onDeleted?: (user: AdminUser) => void;
  notify: (text: string, error?: boolean) => void;
}) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);
  const close = useCallback(() => setDialog(null), []);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); setDialog(null); }
    catch (err) { notify((err as Error).message, true); }
    finally { setBusy(false); }
  }

  let node: React.ReactNode = null;
  if (dialog?.kind === 'create' || dialog?.kind === 'edit') {
    node = <UserFormModal user={dialog.kind === 'edit' ? dialog.user : undefined} onClose={close} onSaved={(u, created) => { setDialog(null); notify(created ? `${u.name} can now sign in` : 'Changes saved'); onChanged(u); }} />;
  } else if (dialog?.kind === 'reset') {
    node = <ResetPasswordModal user={dialog.user} onClose={close} onDone={() => notify('Password reset')} />;
  } else if (dialog?.kind === 'suspend') {
    const u = dialog.user;
    const suspending = !u.disabledAt;
    node = (
      <ConfirmDialog
        title={suspending ? `Suspend ${u.name}?` : `Reactivate ${u.name}?`}
        body={suspending
          ? <>They’re signed out everywhere straight away and can’t sign in until reactivated. Their events stay published.</>
          : <>They’ll be able to sign in again with their existing password.</>}
        confirmLabel={suspending ? 'Suspend account' : 'Reactivate'}
        danger={suspending}
        busy={busy}
        onClose={close}
        onConfirm={() => run(async () => {
          const updated = await adminApi.updateUser(u.id, { disabled: suspending });
          notify(suspending ? `${u.name} suspended` : `${u.name} reactivated`);
          onChanged(updated);
        })}
      />
    );
  } else if (dialog?.kind === 'delete') {
    const u = dialog.user;
    node = (
      <ConfirmDialog
        title={`Delete ${u.name}?`}
        body={<>This permanently removes the account{u.artist ? <> and the organizer profile <strong>@{u.artist.handle}</strong> — including its <strong>{u.artist._count.events} event{u.artist._count.events === 1 ? '' : 's'}</strong></> : null}. This can’t be undone. Suspending is the reversible option.</>}
        confirmLabel="Delete permanently"
        danger
        busy={busy}
        onClose={close}
        onConfirm={() => run(async () => {
          await adminApi.deleteUser(u.id);
          notify(`${u.name} deleted`);
          onDeleted?.(u);
          onChanged();
        })}
      />
    );
  }

  return {
    node,
    create: () => setDialog({ kind: 'create' }),
    edit: (user: AdminUser) => setDialog({ kind: 'edit', user }),
    reset: (user: AdminUser) => setDialog({ kind: 'reset', user }),
    toggleSuspend: (user: AdminUser) => setDialog({ kind: 'suspend', user }),
    remove: (user: AdminUser) => setDialog({ kind: 'delete', user }),
  };
}
