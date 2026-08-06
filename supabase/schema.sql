-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run).

-- One row per signed-up user, holding their display name.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Comments and replies (a reply is a comment with parent_id set).
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  user_id uuid references public.profiles(id) on delete set null,
  guest_name text,
  message text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint comments_author_check check (user_id is not null or guest_name is not null),
  constraint comments_reply_requires_login check (parent_id is null or user_id is not null)
);

create index if not exists comments_slug_idx on public.comments (slug);
create index if not exists comments_parent_idx on public.comments (parent_id);

alter table public.comments enable row level security;

drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

drop policy if exists "Insert comments" on public.comments;
create policy "Insert comments"
  on public.comments for insert
  with check (
    (user_id is null and parent_id is null and guest_name is not null)
    or (user_id is not null and user_id = auth.uid())
  );

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can edit their own comments" on public.comments;
create policy "Users can edit their own comments"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Per-user watch history, one row per (user, video), updated on every rewatch.
-- progress_seconds / duration_seconds power a YouTube-style "watched" progress bar.
create table if not exists public.watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  watched_at timestamptz not null default now(),
  progress_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  primary key (user_id, slug)
);

alter table public.watch_history add column if not exists progress_seconds numeric not null default 0;
alter table public.watch_history add column if not exists duration_seconds numeric not null default 0;

alter table public.watch_history enable row level security;

drop policy if exists "Users can view their own watch history" on public.watch_history;
create policy "Users can view their own watch history"
  on public.watch_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own watch history" on public.watch_history;
create policy "Users can insert their own watch history"
  on public.watch_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own watch history" on public.watch_history;
create policy "Users can update their own watch history"
  on public.watch_history for update
  using (auth.uid() = user_id);

-- Notification preferences per viewer + whether their profile is an admin account.
alter table public.profiles add column if not exists email_notifications boolean not null default false;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Whether this viewer wants an email whenever a new review is published.
alter table public.profiles add column if not exists new_upload_notifications boolean not null default false;

-- R2 object key for the user's profile picture (shown next to their comments).
alter table public.profiles add column if not exists avatar_key text;

-- The "update own profile" policy has no WITH CHECK, so RLS alone can't stop
-- a user from setting is_admin=true on their own row via the browser client.
-- Force it back to its previous value on every update from that path instead.
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.is_admin := old.is_admin;
  return new;
end;
$$;

drop trigger if exists protect_is_admin_trigger on public.profiles;
create trigger protect_is_admin_trigger
  before update on public.profiles
  for each row execute procedure public.protect_is_admin();

-- Notifications for logged-in viewers (currently: "someone replied to your comment").
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  slug text not null,
  comment_id uuid references public.comments(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- No insert policy for regular users: rows are only ever created by the
-- trigger below (which runs as security definer), never directly by a client.

-- A running feed of every new comment/reply, for the site admin only.
-- RLS is enabled with no policies at all, so only the service_role key
-- (used server-side in the admin panel) can read or write this table.
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  slug text not null,
  comment_id uuid references public.comments(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.admin_notifications enable row level security;

-- Single-row table holding the admin's notification preferences.
-- Also service_role-only (no policies) since there's one shared admin login,
-- not a Supabase user account.
create table if not exists public.admin_settings (
  id smallint primary key default 1,
  email_notifications boolean not null default false,
  notify_email text,
  constraint admin_settings_singleton check (id = 1)
);

insert into public.admin_settings (id) values (1) on conflict (id) do nothing;

alter table public.admin_settings enable row level security;

-- Passcode for the /locked section, editable from the admin panel.
-- Falls back to the LOCKED_PASSCODE env var (in code) if this is null.
alter table public.admin_settings add column if not exists locked_passcode text;

-- Second, deeper passcode for the Vault — a locked area nested inside Locked.
-- Reviews with status 'vault' need the Locked passcode first, then this one.
alter table public.admin_settings add column if not exists locked_passcode_2 text;

-- Separate "security passcode" that guards the Locked/Vault passcode fields in
-- the admin panel, so a co-admin who can log in and upload still can't see or
-- change those two codes without also knowing this one.
alter table public.admin_settings add column if not exists settings_passcode text;

-- Site-wide announcement banner, editable from the admin panel. Shown across
-- the public site until it expires or the admin clears it. banner_updated_at
-- bumps only when the message text changes, so dismissing it stays dismissed
-- until the next real change.
alter table public.admin_settings add column if not exists banner_message text;
alter table public.admin_settings add column if not exists banner_expires_at timestamptz;
alter table public.admin_settings add column if not exists banner_updated_at timestamptz;

-- Site-wide lockdown switch. mode: 'off' (normal), 'full' (whole public site
-- closed), or 'code' (public site behind a single passcode). The admin panel
-- is never affected, so the owner can always turn it back off.
alter table public.admin_settings add column if not exists site_lock_mode text not null default 'off';
alter table public.admin_settings add column if not exists site_lock_passcode text;
-- A second passcode that also unlocks the site (e.g. one for a partner, one for
-- friends), plus a hint shown on the lock screen to jog close friends' memory.
alter table public.admin_settings add column if not exists site_lock_passcode_2 text;
alter table public.admin_settings add column if not exists site_lock_hint text;

-- Per-IP bans. banned_ips is a JSON array of IP strings blocked from the public
-- site; ban_message is the note shown to a blocked visitor. The admin panel is
-- never affected, so the owner can't ban themselves out.
alter table public.admin_settings add column if not exists banned_ips jsonb not null default '[]'::jsonb;
alter table public.admin_settings add column if not exists ban_message text;

-- Whenever a comment or reply is posted: log it for the admin, and if it's a
-- reply to someone's comment, notify that person (unless they replied to
-- themselves, or the parent was posted by a guest with no account).
create or replace function public.handle_new_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  parent_user_id uuid;
  preview text;
begin
  preview := left(new.message, 140);

  insert into public.admin_notifications (type, slug, comment_id, message)
  values (
    case when new.parent_id is null then 'new_comment' else 'new_reply' end,
    new.slug,
    new.id,
    preview
  );

  if new.parent_id is not null then
    select user_id into parent_user_id from public.comments where id = new.parent_id;
    if parent_user_id is not null and parent_user_id != new.user_id then
      insert into public.notifications (user_id, type, slug, comment_id, message)
      values (parent_user_id, 'reply', new.slug, new.id, preview);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute procedure public.handle_new_comment();

-- Allow account deletion: when a profile is deleted, comments.user_id is set to
-- null (see "on delete set null" above) but guest_name stays null too, since it
-- was a real account's comment, not a guest's. These two insert-time checks
-- would otherwise block that update, so they're dropped in favor of the
-- equivalent checks already enforced by the "Insert comments" RLS policy above.
alter table public.comments drop constraint if exists comments_author_check;
alter table public.comments drop constraint if exists comments_reply_requires_login;

-- R2 object key for a photo attached to a comment or reply.
alter table public.comments add column if not exists image_key text;
