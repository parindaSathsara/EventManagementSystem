'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, Clock3, ImagePlus, MapPin, Plus, Sparkles, Ticket, Trash2, Upload, UsersRound, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/format';
import type { EventItem } from '@/lib/types';

type TicketDraft = { name: string; price: string; free: boolean };
type LineupDraft = { name: string; instagram: string; facebook: string; tiktok: string };
const categories = ['Live Concert', 'EDM', 'Festival', 'Hip Hop', 'Party', 'Live Set', 'Other'];
const ages = ['All ages', '13+', '18+', '21+'];

function datePart(value?: string) { if (!value) return ''; const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function timePart(value?: string) { if (!value) return ''; const date = new Date(value); return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`; }
function digits(label = '') { return label.replace(/[^0-9]/g, ''); }
function today() { const value = new Date(); return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`; }

export function EventEditor({ event }: { event?: EventItem }) {
  const router = useRouter(); const editing = !!event;
  const [form, setForm] = useState({ title: event?.title || '', description: event?.description || '', category: event?.category || 'Live Concert', date: datePart(event?.startsAt), startTime: event?.startTimeTba ? '' : timePart(event?.startsAt), endTime: event?.startTimeTba ? '' : timePart(event?.endsAt), timeTba: !!event?.startTimeTba, venueName: event?.venueName || '', cityName: event?.cityName || '', addressLine: event?.addressLine || '', ageRestriction: event?.ageRestriction || '18+', ticketUrl: event?.ticketUrl || '', bannerImageUrl: event?.bannerImageUrl || '' });
  const [tickets, setTickets] = useState<TicketDraft[]>(() => event?.ticketTypes?.length ? event.ticketTypes.map((ticket) => ({ name: ticket.name, price: digits(ticket.priceLabel), free: ticket.priceLabel.toLowerCase() === 'free' })) : [{ name: 'General admission', price: '', free: false }]);
  const [lineup, setLineup] = useState<LineupDraft[]>(() => event?.lineup?.length ? event.lineup.map((artist) => ({ name: artist.name, instagram: artist.socials?.instagram || '', facebook: artist.socials?.facebook || '', tiktok: artist.socials?.tiktok || '' })) : [{ name: '', instagram: '', facebook: '', tiktok: '' }]);
  const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (event) document.title = `Edit ${event.title} · Stage`; }, [event]);
  function set(key: string, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })); }
  async function upload(file?: File) { if (!file) return; setUploading(true); setError(''); try { const result = await api.upload<{ url: string }>('/uploads/image', file); set('bannerImageUrl', result.url); } catch (err) { setError((err as Error).message); } finally { setUploading(false); } }

  const checklist = useMemo(() => [
    { label: 'Event name', done: !!form.title.trim() },
    { label: 'Date & time', done: !!form.date && (form.timeTba || (!!form.startTime && !!form.endTime)) },
    { label: 'Location', done: !!form.cityName.trim() },
    { label: 'Event artwork', done: !!form.bannerImageUrl },
    { label: 'Ticket option', done: tickets.some((ticket) => ticket.name.trim()) },
  ], [form, tickets]);
  const completeCount = checklist.filter((item) => item.done).length;

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const startsAt = new Date(`${form.date}T${form.timeTba ? '12:00' : form.startTime}`);
      let endsAt = new Date(`${form.date}T${form.timeTba ? '23:59' : form.endTime}`);
      if (Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf())) throw new Error('Choose a valid event date and time.');
      if (!form.timeTba && endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
      const payload = {
        title: form.title.trim(), description: form.description.trim(), category: form.category, coverColor: '#260b3d',
        ...(form.bannerImageUrl ? { bannerImageUrl: form.bannerImageUrl, flyers: [form.bannerImageUrl] } : { flyers: [] }),
        ...(form.ticketUrl ? { ticketUrl: form.ticketUrl } : { ticketUrl: null }),
        startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), startTimeTba: form.timeTba, timezone: 'Asia/Colombo',
        venueName: form.venueName.trim(), cityName: form.cityName.trim(), ...(form.addressLine ? { addressLine: form.addressLine.trim() } : {}), ageRestriction: form.ageRestriction, status: 'published',
        ticketTypes: tickets.filter((ticket) => ticket.name.trim()).map((ticket) => ({ name: ticket.name.trim(), priceLabel: ticket.free ? 'Free' : ticket.price ? `LKR ${Number(ticket.price).toLocaleString('en-LK')}` : 'Coming soon', priceCents: ticket.free || !ticket.price ? 0 : Math.round(Number(ticket.price) * 100), currency: 'LKR', total: 10000 })),
        lineupArtistIds: [], lineup: lineup.filter((artist) => artist.name.trim()).map((artist) => ({ name: artist.name.trim(), socials: { ...(artist.instagram ? { instagram: artist.instagram } : {}), ...(artist.facebook ? { facebook: artist.facebook } : {}), ...(artist.tiktok ? { tiktok: artist.tiktok } : {}) } })),
      };
      if (editing) await api.patch(`/events/${event.id}`, payload); else await api.post('/events', payload);
      router.push('/studio'); router.refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return <form className="editor-layout" onSubmit={submit}>
    <div className="editor-main">
      <div className="editor-heading"><Link href="/studio" className="text-link"><ArrowLeft size={16} /> Back to studio</Link><p className="eyebrow">{editing ? 'Update listing' : 'New event'}</p><h1>{editing ? 'Make your event shine.' : 'Bring your next event to life.'}</h1><p>Guide customers from “looks interesting” to “I&apos;m going” with a clear, complete listing.</p></div>

      <section className="editor-section">
        <div className="editor-section-head"><span>01</span><div><h2>Start with the story</h2><p>Give people a reason to stop scrolling.</p></div><Sparkles /></div>
        <div className="form-grid">
          <div className="field field-full"><label htmlFor="event-title">Event title <em>Required</em></label><input id="event-title" className="input input-large" required maxLength={200} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Sunset Sessions Colombo" /><span className="field-hint">Keep it memorable and easy to search. <b>{form.title.length}/200</b></span></div>
          <div className="field field-full"><label htmlFor="event-description">What should customers know?</label><textarea id="event-description" className="textarea" maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the atmosphere, music, headline moments and anything guests should bring…" /><span className="field-hint">The best descriptions set expectations without overpromising. <b>{form.description.length}/5000</b></span></div>
          <div className="field"><label htmlFor="event-category">Category</label><select id="event-category" className="select" value={form.category} onChange={(e) => set('category', e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label htmlFor="event-age">Age guidance</label><select id="event-age" className="select" value={form.ageRestriction} onChange={(e) => set('ageRestriction', e.target.value)}>{ages.map((item) => <option key={item}>{item}</option>)}</select></div>
        </div>
      </section>

      <section className="editor-section">
        <div className="editor-section-head"><span>02</span><div><h2>When and where</h2><p>Make arrival feel effortless.</p></div><CalendarDays /></div>
        <div className="form-grid">
          <div className="field"><label htmlFor="event-date">Date <em>Required</em></label><input id="event-date" className="input" type="date" min={editing ? undefined : today()} required value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
          <div className="field"><label>Timing</label><label className="choice-card"><input type="checkbox" checked={form.timeTba} onChange={(e) => set('timeTba', e.target.checked)} /><span><strong>Announce time later</strong><small>Customers will see “Time TBA”.</small></span></label></div>
          {!form.timeTba && <><div className="field"><label htmlFor="event-start">Doors / start <em>Required</em></label><input id="event-start" className="input" type="time" required value={form.startTime} onChange={(e) => set('startTime', e.target.value)} /></div><div className="field"><label htmlFor="event-end">Expected finish <em>Required</em></label><input id="event-end" className="input" type="time" required value={form.endTime} onChange={(e) => set('endTime', e.target.value)} /><span className="field-hint">After-midnight times are handled automatically.</span></div></>}
          <div className="field"><label htmlFor="event-venue">Venue</label><input id="event-venue" className="input" value={form.venueName} onChange={(e) => set('venueName', e.target.value)} placeholder="Venue name or “Secret location”" /></div>
          <div className="field"><label htmlFor="event-city">City <em>Required</em></label><input id="event-city" className="input" required value={form.cityName} onChange={(e) => set('cityName', e.target.value)} placeholder="Colombo" /></div>
          <div className="field field-full"><label htmlFor="event-address">Full address <span>(Optional)</span></label><input id="event-address" className="input" value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} placeholder="Street, area and an easy landmark" /></div>
        </div>
      </section>

      <section className="editor-section">
        <div className="editor-section-head"><span>03</span><div><h2>Add event artwork</h2><p>A strong portrait or flyer helps customers recognize the event.</p></div><ImagePlus /></div>
        <label className={`upload-zone${form.bannerImageUrl ? ' has-media' : ''}`}>
          {form.bannerImageUrl ? <><img src={mediaUrl(form.bannerImageUrl) || form.bannerImageUrl} alt="Event artwork preview" /><span className="upload-overlay"><ImagePlus /> {uploading ? 'Uploading…' : 'Replace artwork'}</span></> : <span><ImagePlus size={34} /><strong>{uploading ? 'Uploading artwork…' : 'Drop in your event artwork'}</strong><small>JPG, PNG, WEBP or GIF · Portrait artwork works best</small><b className="button button-ghost">Choose image</b></span>}
          <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        {form.bannerImageUrl && <button type="button" className="remove-media" onClick={() => set('bannerImageUrl', '')}><X size={14} /> Remove artwork</button>}
      </section>

      <section className="editor-section">
        <div className="editor-section-head"><span>04</span><div><h2>Tickets</h2><p>Give every option a simple name and a clear price.</p></div><Ticket /></div>
        <div className="repeat-list">
          {tickets.map((ticket, index) => <div className="ticket-editor-row" key={index}><span className="repeat-index">{String(index + 1).padStart(2, '0')}</span><div className="field"><label htmlFor={`ticket-${index}`}>Ticket name</label><input id={`ticket-${index}`} className="input" required={index === 0} value={ticket.name} onChange={(e) => setTickets(tickets.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="General admission" /></div><div className="field"><label htmlFor={`price-${index}`}>Price (LKR)</label><input id={`price-${index}`} className="input" type="number" min="0" disabled={ticket.free} value={ticket.price} onChange={(e) => setTickets(tickets.map((item, i) => i === index ? { ...item, price: e.target.value } : item))} placeholder={ticket.free ? 'Free ticket' : 'Leave blank for coming soon'} /></div><label className="compact-check"><input type="checkbox" checked={ticket.free} onChange={(e) => setTickets(tickets.map((item, i) => i === index ? { ...item, free: e.target.checked, price: '' } : item))} /> Free</label>{tickets.length > 1 && <button type="button" className="icon-link danger-icon" onClick={() => setTickets(tickets.filter((_, i) => i !== index))} aria-label={`Remove ticket type ${index + 1}`}><Trash2 size={16} /></button>}</div>)}
        </div>
        <button type="button" className="button button-ghost add-row-button" onClick={() => setTickets([...tickets, { name: '', price: '', free: false }])}><Plus size={16} /> Add another ticket</button>
        <div className="field ticket-link-field"><label htmlFor="ticket-url">External ticketing link <span>(Optional)</span></label><input id="ticket-url" className="input" type="url" value={form.ticketUrl} onChange={(e) => set('ticketUrl', e.target.value)} placeholder="https://ticketing-partner.com/your-event" /><span className="field-hint">If added, the Buy button takes customers directly to your trusted checkout partner.</span></div>
      </section>

      <section className="editor-section">
        <div className="editor-section-head"><span>05</span><div><h2>Build the lineup</h2><p>Add performers in the order customers should see them.</p></div><UsersRound /></div>
        <div className="repeat-list lineup-editor-list">
          {lineup.map((artist, index) => <div className="lineup-editor-card" key={index}><div className="lineup-card-head"><span className="lineup-order">{String(index + 1).padStart(2, '0')}</span><div><strong>{artist.name || `Artist ${index + 1}`}</strong><small>{index === 0 ? 'Top billing' : 'Supporting lineup'}</small></div>{lineup.length > 1 && <button type="button" className="icon-link danger-icon" onClick={() => setLineup(lineup.filter((_, i) => i !== index))} aria-label={`Remove artist ${index + 1}`}><Trash2 size={16} /></button>}</div><div className="form-grid"><div className="field field-full"><label htmlFor={`artist-${index}`}>Artist or act name</label><input id={`artist-${index}`} className="input" value={artist.name} onChange={(e) => setLineup(lineup.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="Artist name" /></div><div className="field"><label htmlFor={`instagram-${index}`}>Instagram <span>(Optional)</span></label><input id={`instagram-${index}`} className="input" type="url" value={artist.instagram} onChange={(e) => setLineup(lineup.map((item, i) => i === index ? { ...item, instagram: e.target.value } : item))} placeholder="https://instagram.com/artist" /></div><div className="field"><label htmlFor={`facebook-${index}`}>Facebook <span>(Optional)</span></label><input id={`facebook-${index}`} className="input" type="url" value={artist.facebook} onChange={(e) => setLineup(lineup.map((item, i) => i === index ? { ...item, facebook: e.target.value } : item))} placeholder="https://facebook.com/artist" /></div><div className="field field-full"><label htmlFor={`tiktok-${index}`}>TikTok <span>(Optional)</span></label><input id={`tiktok-${index}`} className="input" type="url" value={artist.tiktok} onChange={(e) => setLineup(lineup.map((item, i) => i === index ? { ...item, tiktok: e.target.value } : item))} placeholder="https://tiktok.com/@artist" /></div></div></div>)}
        </div>
        <button type="button" className="button button-ghost add-row-button" onClick={() => setLineup([...lineup, { name: '', instagram: '', facebook: '', tiktok: '' }])}><Plus size={16} /> Add another artist</button>
      </section>

      {error && <div className="notice error-notice editor-error" role="alert">{error}</div>}
      <div className="editor-actions"><button type="button" className="button button-ghost" onClick={() => router.back()}>Cancel</button><button className="button button-primary" disabled={busy || uploading}><Upload size={16} /> {busy ? 'Publishing…' : editing ? 'Save changes' : 'Publish event'}</button></div>
    </div>

    <aside className="editor-preview">
      <div className="preview-label"><span>Live preview</span><small>{completeCount} of {checklist.length} essentials ready</small></div>
      <div className="mini-event-card">
        <div className="mini-event-art" style={{ backgroundColor: '#260b3d' }}>{form.bannerImageUrl ? <img src={mediaUrl(form.bannerImageUrl) || form.bannerImageUrl} alt="" /> : <div><ImagePlus /><span>Your artwork will appear here</span></div>}<span>{form.category}</span></div>
        <div><p>{form.date ? new Intl.DateTimeFormat('en-LK', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${form.date}T12:00`)) : 'Date to be announced'}</p><h3>{form.title || 'Your event title'}</h3><span><MapPin size={13} /> {form.venueName || 'Venue TBA'}{form.cityName ? `, ${form.cityName}` : ''}</span><span><Clock3 size={13} /> {form.timeTba ? 'Time TBA' : form.startTime || 'Start time'}</span></div>
      </div>
      <div className="publish-checklist"><h3>Ready to publish?</h3>{checklist.map((item) => <span className={item.done ? 'done' : ''} key={item.label}>{item.done ? <Check /> : <i />}{item.label}</span>)}</div>
      <p className="preview-note">Your event publishes immediately. You can return to Studio and update any detail later.</p>
    </aside>
  </form>;
}
