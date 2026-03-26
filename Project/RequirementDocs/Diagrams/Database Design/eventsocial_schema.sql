-- EventSocial Database Design v1.0
-- Source of truth: RequirementDocs/eventsocial_full_requirements.md
-- Engine: PostgreSQL 15+

create extension if not exists pgcrypto;
create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists citext;

create schema if not exists ref;
create schema if not exists iam;
create schema if not exists artist;
create schema if not exists media;
create schema if not exists venue;
create schema if not exists events;
create schema if not exists social;
create schema if not exists marketing;
create schema if not exists moderation;
create schema if not exists notify;
create schema if not exists ticketing;
create schema if not exists payments;
create schema if not exists analytics;
create schema if not exists ops;
create schema if not exists approval;

-- ============================================================
-- Reference data (configuration, no hardcoded app enums)
-- ============================================================
create table if not exists ref.roles (
  role_code text primary key,
  description text not null,
  is_admin_role boolean not null default false,
  created_at timestamptz not null default now()
);

insert into ref.roles (role_code, description, is_admin_role) values
('customer', 'Customer mobile user', false),
('artist', 'Verified or pending artist', false),
('admin', 'Base admin access', true),
('super_admin', 'Platform super admin', true),
('event_manager', 'Event operations manager', true),
('moderator', 'Content moderation manager', true),
('finance', 'Finance admin role', true)
on conflict (role_code) do nothing;

create table if not exists ref.artist_categories (
  artist_category_id uuid primary key default gen_random_uuid(),
  category_name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists ref.event_categories (
  event_category_id uuid primary key default gen_random_uuid(),
  category_name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists ref.reaction_types (
  reaction_code text primary key,
  emoji text not null,
  label text not null,
  display_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into ref.reaction_types (reaction_code, emoji, label, display_order) values
('fire', 'FIRE', 'Fire', 1),
('love', 'LOVE', 'Love', 2),
('hands_up', 'HANDS_UP', 'Hands Up', 3),
('wow', 'WOW', 'Wow', 4),
('party', 'PARTY', 'Party', 5)
on conflict (reaction_code) do nothing;

create table if not exists ref.age_restrictions (
  restriction_code text primary key,
  label text not null,
  min_age smallint check (min_age between 0 and 120)
);

insert into ref.age_restrictions (restriction_code, label, min_age) values
('all_ages', 'All Ages', 0),
('18_plus', '18+', 18),
('21_plus', '21+', 21)
on conflict (restriction_code) do nothing;

create table if not exists ref.report_reasons (
  reason_code text primary key,
  label text not null,
  is_active boolean not null default true
);

insert into ref.report_reasons (reason_code, label) values
('spam', 'Spam'),
('inappropriate', 'Inappropriate content'),
('fake_event', 'Fake or scam event'),
('hate_harassment', 'Hate or harassment'),
('copyright', 'Copyright infringement'),
('other', 'Other')
on conflict (reason_code) do nothing;
-- ============================================================
-- Identity and access management
-- ============================================================
create table if not exists iam.users (
  user_id uuid primary key default gen_random_uuid(),
  phone_e164 text unique,
  email citext unique,
  display_name text not null,
  avatar_url text,
  bio text,
  account_status text not null default 'active'
    check (account_status in ('pending', 'active', 'suspended', 'banned', 'deleted')),
  is_phone_verified boolean not null default false,
  is_email_verified boolean not null default false,
  repost_visibility_default text not null default 'public'
    check (repost_visibility_default in ('public', 'followers', 'private')),
  birth_date date,
  city_name text,
  country_code char(2),
  timezone_name text not null default 'UTC',
  first_touch_id uuid,
  last_touch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (phone_e164 is not null or email is not null)
);

create index if not exists idx_users_status on iam.users (account_status);
create index if not exists idx_users_created_at on iam.users (created_at desc);

create table if not exists iam.user_roles (
  user_id uuid not null references iam.users(user_id) on delete cascade,
  role_code text not null references ref.roles(role_code),
  assigned_by uuid references iam.users(user_id),
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role_code, assigned_at)
);

create unique index if not exists ux_user_roles_active
  on iam.user_roles(user_id, role_code)
  where revoked_at is null;

create table if not exists iam.auth_identities (
  auth_identity_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id) on delete cascade,
  provider_type text not null
    check (provider_type in ('phone_otp', 'email_password', 'google', 'apple', 'facebook')),
  provider_subject text not null,
  password_hash text,
  is_primary boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider_type, provider_subject)
);

create index if not exists idx_auth_identities_user on iam.auth_identities (user_id);

create table if not exists iam.user_devices (
  device_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  push_token text not null,
  token_status text not null default 'active' check (token_status in ('active', 'disabled', 'invalid')),
  app_version text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (platform, push_token)
);

create table if not exists iam.saved_locations (
  saved_location_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id) on delete cascade,
  label text not null,
  city_name text,
  region_name text,
  country_code char(2),
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  radius_km numeric(5,2) not null default 10.00 check (radius_km > 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_saved_location_default
  on iam.saved_locations(user_id)
  where is_default;

-- ============================================================
-- Artist verification and profile
-- ============================================================
create table if not exists artist.artist_profiles (
  user_id uuid primary key references iam.users(user_id) on delete cascade,
  stage_handle citext not null unique,
  stage_name text not null,
  legal_name text,
  artist_category_id uuid references ref.artist_categories(artist_category_id),
  city_name text,
  country_code char(2),
  about_text text,
  verified_status text not null default 'pending'
    check (verified_status in ('pending', 'approved', 'rejected', 'suspended', 'reverification_required')),
  verified_badge boolean not null default false,
  can_publish boolean not null default false,
  suspended_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_artist_profiles_verified on artist.artist_profiles (verified_status);
create index if not exists idx_artist_profiles_city on artist.artist_profiles (city_name);

-- Preferred artist designation for auto-approval
create table if not exists artist.preferred_artists (
  artist_user_id uuid primary key references artist.artist_profiles(user_id) on delete cascade,
  is_active boolean not null default true,
  granted_by_user_id uuid not null references iam.users(user_id),
  granted_at timestamptz not null default now(),
  revoked_by_user_id uuid references iam.users(user_id),
  revoked_at timestamptz,
  revocation_reason text,
  notes text
);

create index if not exists idx_preferred_artists_active
  on artist.preferred_artists (is_active)
  where is_active;

create table if not exists artist.artist_social_links (
  social_link_id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references artist.artist_profiles(user_id) on delete cascade,
  platform text not null,
  profile_url text not null,
  handle text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (artist_user_id, platform, profile_url)
);

create table if not exists artist.verification_requests (
  verification_request_id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references artist.artist_profiles(user_id) on delete cascade,
  request_status text not null default 'submitted'
    check (request_status in ('submitted', 'under_review', 'approved', 'rejected', 'suspended', 'reverification_required')),
  submitted_at timestamptz not null default now(),
  reviewed_by_user_id uuid references iam.users(user_id),
  reviewed_at timestamptz,
  rejection_reason text,
  internal_notes text,
  metadata_json jsonb not null default '{}'::jsonb
);

create index if not exists idx_verification_requests_status
  on artist.verification_requests (request_status, submitted_at desc);

create table if not exists artist.verification_documents (
  verification_document_id uuid primary key default gen_random_uuid(),
  verification_request_id uuid not null references artist.verification_requests(verification_request_id) on delete cascade,
  document_type text not null check (document_type in ('national_id', 'passport', 'driving_license', 'portfolio', 'other')),
  file_url text not null,
  file_hash text,
  uploaded_at timestamptz not null default now()
);

-- ============================================================
-- Media assets
-- ============================================================
create table if not exists media.assets (
  asset_id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references iam.users(user_id) on delete set null,
  asset_type text not null check (asset_type in ('video', 'image', 'document')),
  storage_provider text not null check (storage_provider in ('s3', 'r2', 'gcs', 'local', 'other')),
  bucket_name text,
  object_key text not null,
  public_url text,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  duration_ms integer check (duration_ms >= 0),
  width_px integer check (width_px >= 0),
  height_px integer check (height_px >= 0),
  sha256_hex text,
  processing_status text not null default 'ready' check (processing_status in ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  unique (storage_provider, object_key)
);

create index if not exists idx_media_assets_owner on media.assets (owner_user_id, created_at desc);

-- ============================================================
-- Music library (admin-managed licensed tracks for reel editing)
-- ============================================================
create table if not exists media.music_library (
  music_track_id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_name text not null,
  genre text,
  duration_ms integer not null check (duration_ms > 0),
  bpm smallint check (bpm is null or bpm > 0),
  audio_asset_id uuid not null references media.assets(asset_id),
  cover_asset_id uuid references media.assets(asset_id),
  is_licensed boolean not null default true,
  license_info text,
  is_active boolean not null default true,
  uploaded_by_user_id uuid references iam.users(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_music_library_active on media.music_library (is_active, genre, created_at desc);
create index if not exists idx_music_library_search on media.music_library using gin (title gin_trgm_ops);

-- ============================================================
-- Reel edit projects (in-app reel editing sessions)
-- ============================================================
create table if not exists media.reel_edit_projects (
  edit_project_id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references artist.artist_profiles(user_id) on delete cascade,
  reel_id uuid references social.reels(reel_id) on delete set null,
  source_asset_id uuid not null references media.assets(asset_id),
  edited_asset_id uuid references media.assets(asset_id),
  edit_operations_json jsonb not null default '[]'::jsonb,
  is_original_audio_muted boolean not null default false,
  original_audio_volume numeric(3,2) not null default 1.00 check (original_audio_volume between 0 and 1),
  music_volume numeric(3,2) not null default 0.80 check (music_volume between 0 and 1),
  status text not null default 'draft'
    check (status in ('draft', 'processing', 'completed', 'failed')),
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reel_edit_projects_artist
  on media.reel_edit_projects (artist_user_id, created_at desc);

create index if not exists idx_reel_edit_projects_status
  on media.reel_edit_projects (status)
  where status in ('draft', 'processing');
-- ============================================================
-- Venue and location
-- ============================================================
create table if not exists venue.venues (
  venue_id uuid primary key default gen_random_uuid(),
  venue_name text not null,
  address_line1 text not null,
  address_line2 text,
  city_name text not null,
  region_name text,
  country_code char(2) not null,
  postal_code text,
  location geography(point, 4326) not null,
  capacity integer check (capacity > 0),
  status_code text not null default 'active' check (status_code in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_venues_location on venue.venues using gist (location);
create index if not exists idx_venues_city on venue.venues (city_name);

-- ============================================================
-- Events domain
-- ============================================================
create table if not exists events.events (
  event_id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references iam.users(user_id),
  organizer_artist_user_id uuid references artist.artist_profiles(user_id),
  title text not null,
  slug citext unique,
  description text not null,
  event_category_id uuid not null references ref.event_categories(event_category_id),
  start_at_utc timestamptz not null,
  end_at_utc timestamptz not null,
  timezone_name text not null,
  venue_id uuid not null references venue.venues(venue_id),
  city_name text not null,
  region_name text,
  country_code char(2),
  banner_asset_id uuid references media.assets(asset_id),
  age_restriction_code text not null references ref.age_restrictions(restriction_code),
  requires_approval boolean not null default false,
  approval_status text not null default 'not_required'
    check (approval_status in ('not_required', 'pending', 'approved', 'rejected')),
  status_code text not null default 'draft'
    check (status_code in ('draft', 'pending_approval', 'published', 'sold_out', 'completed', 'cancelled', 'rescheduled', 'hidden')),
  is_featured boolean not null default false,
  waitlist_enabled boolean not null default false,
  cancellation_policy_text text,
  refund_policy_text text,
  rescheduled_from_event_id uuid references events.events(event_id),
  published_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at_utc > start_at_utc)
);

create index if not exists idx_events_status_time on events.events (status_code, start_at_utc);
create index if not exists idx_events_category_time on events.events (event_category_id, start_at_utc);
create index if not exists idx_events_venue on events.events (venue_id, start_at_utc);

create table if not exists events.event_artists (
  event_id uuid not null references events.events(event_id) on delete cascade,
  artist_user_id uuid not null references artist.artist_profiles(user_id),
  lineup_role text not null default 'performer',
  lineup_order integer not null default 100,
  is_headliner boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (event_id, artist_user_id)
);

create index if not exists idx_event_artists_artist on events.event_artists (artist_user_id, event_id);

create table if not exists events.event_media (
  event_media_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events.events(event_id) on delete cascade,
  asset_id uuid not null references media.assets(asset_id),
  media_role text not null check (media_role in ('poster', 'gallery', 'lineup', 'aftermovie', 'other')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique (event_id, asset_id, media_role)
);

create table if not exists events.event_approval_requests (
  event_approval_request_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events.events(event_id) on delete cascade,
  submitted_by_user_id uuid not null references iam.users(user_id),
  status_code text not null default 'pending' check (status_code in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by_user_id uuid references iam.users(user_id),
  reviewed_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_approval_requests_status
  on events.event_approval_requests (status_code, created_at desc);

create table if not exists events.event_changes (
  event_change_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events.events(event_id) on delete cascade,
  change_type text not null,
  change_severity text not null check (change_severity in ('minor', 'major')),
  old_value_json jsonb,
  new_value_json jsonb,
  change_reason text,
  changed_by_user_id uuid not null references iam.users(user_id),
  created_at timestamptz not null default now()
);

create index if not exists idx_event_changes_event_created
  on events.event_changes (event_id, created_at desc);
-- ============================================================
-- Social domain
-- ============================================================
create table if not exists social.reels (
  reel_id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references artist.artist_profiles(user_id),
  video_asset_id uuid not null references media.assets(asset_id),
  cover_asset_id uuid references media.assets(asset_id),
  caption text,
  location_label text,
  linked_event_id uuid references events.events(event_id) on delete set null,
  status_code text not null default 'draft' check (status_code in ('draft', 'pending_approval', 'published', 'hidden', 'removed', 'rejected')),
  approval_status text not null default 'not_submitted'
    check (approval_status in ('not_submitted', 'pending', 'approved', 'rejected', 'auto_approved')),
  approved_by_user_id uuid references iam.users(user_id),
  approved_at timestamptz,
  rejection_reason text,
  published_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reels_artist_status on social.reels (artist_user_id, status_code, created_at desc);
create index if not exists idx_reels_event on social.reels (linked_event_id, created_at desc);
create index if not exists idx_reels_approval_status on social.reels (approval_status, created_at desc)
  where approval_status = 'pending';

-- Reel music track overlay (links music library tracks to reels)
create table if not exists social.reel_music_tracks (
  reel_music_track_id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references social.reels(reel_id) on delete cascade,
  music_track_id uuid not null references media.music_library(music_track_id),
  start_offset_ms integer not null default 0 check (start_offset_ms >= 0),
  end_offset_ms integer check (end_offset_ms is null or end_offset_ms > start_offset_ms),
  volume_level numeric(3,2) not null default 0.80 check (volume_level between 0 and 1),
  created_at timestamptz not null default now(),
  unique (reel_id, music_track_id)
);

create index if not exists idx_reel_music_tracks_reel on social.reel_music_tracks (reel_id);

create table if not exists social.reel_tags (
  reel_id uuid not null references social.reels(reel_id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  primary key (reel_id, tag)
);

create index if not exists idx_reel_tags_trgm on social.reel_tags using gin (tag gin_trgm_ops);

create table if not exists social.reel_reactions (
  reel_id uuid not null references social.reels(reel_id) on delete cascade,
  user_id uuid not null references iam.users(user_id) on delete cascade,
  reaction_code text not null references ref.reaction_types(reaction_code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);

create index if not exists idx_reel_reactions_code on social.reel_reactions (reel_id, reaction_code);

create table if not exists social.reposts (
  repost_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id) on delete cascade,
  reel_id uuid not null references social.reels(reel_id) on delete cascade,
  caption text,
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  status_code text not null default 'active' check (status_code in ('active', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, reel_id)
);

create index if not exists idx_reposts_user_created on social.reposts (user_id, created_at desc);

create table if not exists social.follows (
  follower_user_id uuid not null references iam.users(user_id) on delete cascade,
  artist_user_id uuid not null references artist.artist_profiles(user_id) on delete cascade,
  muted boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, artist_user_id),
  check (follower_user_id <> artist_user_id)
);

create index if not exists idx_follows_artist on social.follows (artist_user_id, created_at desc);

create table if not exists social.saves (
  save_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id) on delete cascade,
  reel_id uuid references social.reels(reel_id) on delete cascade,
  event_id uuid references events.events(event_id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(reel_id, event_id) = 1)
);

create unique index if not exists ux_saves_user_reel
  on social.saves (user_id, reel_id)
  where reel_id is not null;

create unique index if not exists ux_saves_user_event
  on social.saves (user_id, event_id)
  where event_id is not null;

create table if not exists social.reel_negative_signals (
  reel_negative_signal_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id) on delete cascade,
  reel_id uuid not null references social.reels(reel_id) on delete cascade,
  signal_type text not null check (signal_type in ('not_interested', 'hide_creator')),
  created_at timestamptz not null default now(),
  unique (user_id, reel_id, signal_type)
);

create table if not exists events.event_featured_reels (
  event_id uuid not null references events.events(event_id) on delete cascade,
  reel_id uuid not null references social.reels(reel_id) on delete cascade,
  featured_by_user_id uuid references iam.users(user_id),
  sort_order integer not null default 100,
  featured_at timestamptz not null default now(),
  primary key (event_id, reel_id)
);

-- ============================================================
-- Marketing and attribution
-- ============================================================
create table if not exists marketing.attribution_touches (
  touch_id uuid primary key default gen_random_uuid(),
  user_id uuid references iam.users(user_id) on delete set null,
  session_id uuid,
  touch_kind text not null check (touch_kind in ('first_touch', 'last_touch', 'session_touch', 'booking_touch', 'link_click')),
  source text,
  medium text,
  campaign text,
  content text,
  term text,
  fbclid text,
  gclid text,
  landing_url text,
  target_reel_id uuid references social.reels(reel_id) on delete set null,
  target_event_id uuid references events.events(event_id) on delete set null,
  target_artist_user_id uuid references artist.artist_profiles(user_id) on delete set null,
  is_deferred boolean not null default false,
  occurred_at timestamptz not null default now(),
  check (num_nonnulls(target_reel_id, target_event_id, target_artist_user_id) <= 1)
);

create index if not exists idx_attribution_user_time
  on marketing.attribution_touches (user_id, occurred_at desc);

create index if not exists idx_attribution_campaign
  on marketing.attribution_touches (source, medium, campaign);

create table if not exists marketing.short_links (
  short_link_id uuid primary key default gen_random_uuid(),
  short_code text not null unique,
  destination_url text not null,
  target_reel_id uuid references social.reels(reel_id) on delete set null,
  target_event_id uuid references events.events(event_id) on delete set null,
  target_artist_user_id uuid references artist.artist_profiles(user_id) on delete set null,
  created_by_user_id uuid references iam.users(user_id) on delete set null,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(target_reel_id, target_event_id, target_artist_user_id) <= 1)
);

create table if not exists marketing.short_link_clicks (
  short_link_click_id bigserial primary key,
  short_link_id uuid not null references marketing.short_links(short_link_id) on delete cascade,
  user_id uuid references iam.users(user_id) on delete set null,
  attribution_touch_id uuid references marketing.attribution_touches(touch_id) on delete set null,
  referrer_url text,
  user_agent text,
  ip_hash text,
  clicked_at timestamptz not null default now()
);

create table if not exists marketing.deferred_link_claims (
  deferred_link_claim_id uuid primary key default gen_random_uuid(),
  touch_id uuid not null references marketing.attribution_touches(touch_id) on delete cascade,
  device_fingerprint_hash text not null,
  claimed_by_user_id uuid references iam.users(user_id) on delete set null,
  claimed_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_users_first_touch'
  ) then
    alter table iam.users
      add constraint fk_users_first_touch
      foreign key (first_touch_id) references marketing.attribution_touches(touch_id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_users_last_touch'
  ) then
    alter table iam.users
      add constraint fk_users_last_touch
      foreign key (last_touch_id) references marketing.attribution_touches(touch_id) on delete set null;
  end if;
end $$;
-- ============================================================
-- Moderation and trust
-- ============================================================
create table if not exists moderation.reports (
  report_id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references iam.users(user_id) on delete cascade,
  target_reel_id uuid references social.reels(reel_id) on delete cascade,
  target_event_id uuid references events.events(event_id) on delete cascade,
  target_artist_user_id uuid references artist.artist_profiles(user_id) on delete cascade,
  target_repost_id uuid references social.reposts(repost_id) on delete cascade,
  target_user_id uuid references iam.users(user_id) on delete cascade,
  reason_code text not null references ref.report_reasons(reason_code),
  details text,
  status_code text not null default 'open' check (status_code in ('open', 'in_review', 'resolved', 'dismissed', 'auto_hidden')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid references iam.users(user_id),
  check (num_nonnulls(target_reel_id, target_event_id, target_artist_user_id, target_repost_id, target_user_id) = 1)
);

create index if not exists idx_reports_status_created on moderation.reports (status_code, created_at desc);
create index if not exists idx_reports_target_event on moderation.reports (target_event_id) where target_event_id is not null;
create index if not exists idx_reports_target_reel on moderation.reports (target_reel_id) where target_reel_id is not null;

create table if not exists moderation.actions (
  moderation_action_id uuid primary key default gen_random_uuid(),
  report_id uuid references moderation.reports(report_id) on delete set null,
  action_type text not null
    check (action_type in ('warn', 'hide_content', 'remove_content', 'restore_content', 'suspend_user', 'ban_user', 'require_reverification')),
  target_reel_id uuid references social.reels(reel_id) on delete cascade,
  target_event_id uuid references events.events(event_id) on delete cascade,
  target_artist_user_id uuid references artist.artist_profiles(user_id) on delete cascade,
  target_repost_id uuid references social.reposts(repost_id) on delete cascade,
  target_user_id uuid references iam.users(user_id) on delete cascade,
  notes text,
  performed_by_user_id uuid not null references iam.users(user_id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  check (num_nonnulls(target_reel_id, target_event_id, target_artist_user_id, target_repost_id, target_user_id) = 1)
);

create index if not exists idx_moderation_actions_created
  on moderation.actions (created_at desc);

create table if not exists moderation.user_strikes (
  user_strike_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id) on delete cascade,
  moderation_action_id uuid references moderation.actions(moderation_action_id) on delete set null,
  strike_level smallint not null check (strike_level between 1 and 3),
  reason_text text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists idx_user_strikes_user on moderation.user_strikes (user_id, created_at desc);

create table if not exists moderation.auto_hide_rules (
  target_type text primary key check (target_type in ('reel', 'event', 'artist_profile', 'repost')),
  unique_reports_1h integer not null default 10 check (unique_reports_1h > 0),
  total_reports_24h integer not null default 25 check (total_reports_24h > 0),
  is_enabled boolean not null default true,
  updated_by_user_id uuid references iam.users(user_id),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Notifications
-- ============================================================
create table if not exists notify.notification_preferences (
  user_id uuid primary key references iam.users(user_id) on delete cascade,
  event_reminders_enabled boolean not null default true,
  new_events_from_followed_enabled boolean not null default true,
  nearby_events_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  engagement_notifications_enabled boolean not null default true,
  event_performance_digests_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists notify.notification_batches (
  notification_batch_id uuid primary key default gen_random_uuid(),
  batch_type text not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists notify.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id) on delete cascade,
  notification_type_code text not null,
  channel text not null check (channel in ('push', 'email', 'sms', 'in_app')),
  title text not null,
  body text not null,
  payload_json jsonb not null default '{}'::jsonb,
  status_code text not null default 'queued' check (status_code in ('queued', 'scheduled', 'sent', 'failed', 'read', 'cancelled')),
  notification_batch_id uuid references notify.notification_batches(notification_batch_id) on delete set null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_status
  on notify.notifications (user_id, status_code, created_at desc);
-- ============================================================
-- Ticketing and booking
-- ============================================================
create table if not exists ticketing.ticket_types (
  ticket_type_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events.events(event_id) on delete cascade,
  type_name text not null,
  description text,
  price_amount numeric(12,2) not null default 0 check (price_amount >= 0),
  currency_code char(3) not null default 'USD',
  capacity integer not null check (capacity >= 0),
  sold_count integer not null default 0 check (sold_count >= 0),
  per_user_limit integer check (per_user_limit is null or per_user_limit > 0),
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  status_code text not null default 'active' check (status_code in ('active', 'inactive', 'sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sales_end_at is null or sales_start_at is null or sales_end_at > sales_start_at)
);

create index if not exists idx_ticket_types_event on ticketing.ticket_types (event_id);

create table if not exists ticketing.bookings (
  booking_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(user_id),
  event_id uuid not null references events.events(event_id),
  booking_mode text not null check (booking_mode in ('free_reservation', 'paid_purchase')),
  booking_status text not null default 'initiated'
    check (booking_status in ('initiated', 'reserved', 'confirmed', 'cancelled', 'expired', 'failed', 'refunded')),
  subtotal_amount numeric(12,2) not null default 0 check (subtotal_amount >= 0),
  service_fee_amount numeric(12,2) not null default 0 check (service_fee_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  currency_code char(3) not null default 'USD',
  attribution_touch_id uuid references marketing.attribution_touches(touch_id) on delete set null,
  reserved_until timestamptz,
  purchased_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_user_created on ticketing.bookings (user_id, created_at desc);
create index if not exists idx_bookings_event_status on ticketing.bookings (event_id, booking_status);

create table if not exists ticketing.booking_items (
  booking_item_id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references ticketing.bookings(booking_id) on delete cascade,
  ticket_type_id uuid not null references ticketing.ticket_types(ticket_type_id),
  quantity integer not null check (quantity > 0),
  unit_price_amount numeric(12,2) not null check (unit_price_amount >= 0),
  service_fee_amount numeric(12,2) not null default 0 check (service_fee_amount >= 0),
  line_total_amount numeric(12,2) not null check (line_total_amount >= 0)
);

create table if not exists ticketing.tickets (
  ticket_id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references ticketing.bookings(booking_id) on delete cascade,
  ticket_type_id uuid not null references ticketing.ticket_types(ticket_type_id),
  owner_user_id uuid not null references iam.users(user_id),
  event_id uuid not null references events.events(event_id),
  qr_token_hash text not null unique,
  qr_payload_json jsonb,
  status_code text not null default 'issued' check (status_code in ('issued', 'validated', 'cancelled', 'refunded', 'expired')),
  issued_at timestamptz not null default now(),
  validated_at timestamptz,
  validated_by_user_id uuid references iam.users(user_id)
);

create index if not exists idx_tickets_event_status on ticketing.tickets (event_id, status_code);
create index if not exists idx_tickets_owner on ticketing.tickets (owner_user_id, issued_at desc);

create table if not exists ticketing.ticket_scans (
  ticket_scan_id bigserial primary key,
  ticket_id uuid not null references ticketing.tickets(ticket_id) on delete cascade,
  scanner_user_id uuid references iam.users(user_id),
  scan_device_id text,
  is_offline boolean not null default false,
  result_code text not null check (result_code in ('valid', 'already_used', 'cancelled', 'invalid', 'expired')),
  scanned_at timestamptz not null default now(),
  notes text
);

create table if not exists ticketing.refund_requests (
  refund_request_id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references ticketing.bookings(booking_id) on delete cascade,
  requested_by_user_id uuid not null references iam.users(user_id),
  reason_text text,
  status_code text not null default 'requested' check (status_code in ('requested', 'approved', 'rejected', 'processed')),
  refund_amount numeric(12,2) not null check (refund_amount >= 0),
  currency_code char(3) not null default 'USD',
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid references iam.users(user_id)
);

-- ============================================================
-- Payments
-- ============================================================
create table if not exists payments.gateways (
  gateway_code text primary key,
  display_name text not null,
  is_active boolean not null default true,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists payments.payment_attempts (
  payment_attempt_id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references ticketing.bookings(booking_id) on delete cascade,
  gateway_code text not null references payments.gateways(gateway_code),
  idempotency_key text not null,
  external_payment_id text,
  status_code text not null default 'created'
    check (status_code in ('created', 'pending', 'authorized', 'captured', 'failed', 'refunded', 'voided')),
  amount numeric(12,2) not null check (amount >= 0),
  currency_code char(3) not null default 'USD',
  request_payload_json jsonb,
  response_payload_json jsonb,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gateway_code, idempotency_key),
  unique (gateway_code, external_payment_id)
);

create index if not exists idx_payment_attempts_booking on payments.payment_attempts (booking_id, created_at desc);

create table if not exists payments.webhook_events (
  webhook_event_id uuid primary key default gen_random_uuid(),
  gateway_code text not null references payments.gateways(gateway_code),
  external_event_id text not null,
  signature_valid boolean not null default false,
  payload_json jsonb not null,
  process_status text not null default 'received' check (process_status in ('received', 'processed', 'duplicate', 'failed')),
  process_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (gateway_code, external_event_id)
);

create table if not exists payments.artist_settlements (
  artist_settlement_id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references artist.artist_profiles(user_id),
  event_id uuid references events.events(event_id),
  period_start date not null,
  period_end date not null,
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  platform_fee_amount numeric(12,2) not null check (platform_fee_amount >= 0),
  net_amount numeric(12,2) not null check (net_amount >= 0),
  status_code text not null default 'pending' check (status_code in ('pending', 'approved', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (period_end >= period_start)
);

-- ============================================================
-- Analytics and operations
-- ============================================================
create table if not exists analytics.user_sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid references iam.users(user_id) on delete set null,
  platform text,
  app_version text,
  first_touch_id uuid references marketing.attribution_touches(touch_id) on delete set null,
  last_touch_id uuid references marketing.attribution_touches(touch_id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists analytics.app_events (
  app_event_id bigserial primary key,
  event_name text not null,
  user_id uuid references iam.users(user_id) on delete set null,
  session_id uuid references analytics.user_sessions(session_id) on delete set null,
  attribution_touch_id uuid references marketing.attribution_touches(touch_id) on delete set null,
  event_properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_app_events_name_time on analytics.app_events (event_name, occurred_at desc);
create index if not exists idx_app_events_user_time on analytics.app_events (user_id, occurred_at desc);

create table if not exists ops.system_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  updated_by_user_id uuid references iam.users(user_id),
  updated_at timestamptz not null default now()
);

create table if not exists ops.audit_logs (
  audit_log_id bigserial primary key,
  actor_user_id uuid references iam.users(user_id),
  action_name text not null,
  entity_schema text not null,
  entity_table text not null,
  entity_id text not null,
  before_json jsonb,
  after_json jsonb,
  request_id text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor_time on ops.audit_logs (actor_user_id, created_at desc);
create index if not exists idx_audit_logs_entity on ops.audit_logs (entity_schema, entity_table, entity_id);

-- ============================================================
-- Content approval queue
-- ============================================================
create table if not exists approval.content_approval_queue (
  approval_id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('reel', 'event')),
  content_reel_id uuid references social.reels(reel_id) on delete cascade,
  content_event_id uuid references events.events(event_id) on delete cascade,
  artist_user_id uuid not null references artist.artist_profiles(user_id) on delete cascade,
  is_auto_approved boolean not null default false,
  status_code text not null default 'pending'
    check (status_code in ('pending', 'approved', 'rejected', 'auto_approved', 'resubmitted')),
  submitted_at timestamptz not null default now(),
  reviewed_by_user_id uuid references iam.users(user_id),
  reviewed_at timestamptz,
  rejection_reason text,
  internal_notes text,
  previous_approval_id uuid references approval.content_approval_queue(approval_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(content_reel_id, content_event_id) = 1)
);

create index if not exists idx_approval_queue_status
  on approval.content_approval_queue (status_code, submitted_at asc)
  where status_code = 'pending';

create index if not exists idx_approval_queue_artist
  on approval.content_approval_queue (artist_user_id, created_at desc);

create index if not exists idx_approval_queue_content_type
  on approval.content_approval_queue (content_type, status_code, submitted_at asc);

-- ============================================================
-- Initial policy seeds (open-decision friendly)
-- ============================================================
insert into ops.system_settings (setting_key, setting_value) values
('event_approval_workflow', '{"mode": "configurable_per_region", "default": "requires_approval"}'::jsonb),
('content_approval_mode', '{"reel_approval": "manual_default_auto_preferred", "event_approval": "manual_default_auto_preferred", "description": "manual for non-preferred artists, auto for preferred artists"}'::jsonb),
('repost_caption_policy', '{"enabled": true, "max_length": 120}'::jsonb),
('phase1_ticket_mode', '{"mode": "free_or_paid_configurable"}'::jsonb),
('near_me_permission_prompt', '{"mode": "on_calendar_use"}'::jsonb),
('age_restriction_enforcement', '{"mode": "label_plus_optional_verification"}'::jsonb)
on conflict (setting_key) do nothing;

insert into moderation.auto_hide_rules (target_type, unique_reports_1h, total_reports_24h, is_enabled)
values
('reel', 10, 25, true),
('event', 10, 25, true),
('artist_profile', 10, 25, true),
('repost', 10, 25, true)
on conflict (target_type) do nothing;
