-- Yayın öncesi: spam sınırı, müşteri iptali, KVKK, manuel randevu/blok ve personel hesapları.

alter table public.salons
  add column max_active_bookings integer not null default 3,
  add column max_daily_bookings integer not null default 1,
  add column cancellation_cutoff_hours integer not null default 3,
  add constraint salons_max_active_check check (max_active_bookings between 1 and 10),
  add constraint salons_max_daily_check check (max_daily_bookings between 1 and 5),
  add constraint salons_cutoff_check check (cancellation_cutoff_hours between 0 and 72);

alter table public.staff
  add column user_id uuid unique references auth.users (id) on delete set null;

alter table public.appointments
  add column manage_token text,
  add column consent_at timestamptz,
  add column consent_version text,
  add column customer_erased boolean not null default false;

update public.appointments
set manage_token = encode(gen_random_bytes(24), 'hex')
where manage_token is null;

alter table public.appointments
  alter column manage_token set not null,
  alter column manage_token set default encode(gen_random_bytes(24), 'hex'),
  alter column customer_phone drop not null,
  alter column service_id drop not null;

alter table public.appointments
  add constraint appointments_manage_token_key unique (manage_token);

alter table public.appointments drop constraint appointments_phone_check;
alter table public.appointments
  add constraint appointments_phone_check check (
    customer_phone is null or customer_phone ~ '^05[0-9]{9}$'
  );

alter table public.appointments drop constraint appointments_status_check;
alter table public.appointments
  add constraint appointments_status_check check (
    status in ('booked', 'done', 'cancelled', 'blocked')
  );

create table public.booking_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

create index booking_attempts_ip_time_idx on public.booking_attempts (ip, created_at desc);

alter table public.booking_attempts enable row level security;
revoke all on public.booking_attempts from anon, authenticated;

create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint staff_invites_email_check check (position('@' in email) > 1)
);

alter table public.staff_invites enable row level security;

create policy staff_invites_owner on public.staff_invites
  for all to authenticated
  using (public.is_salon_owner(salon_id))
  with check (public.is_salon_owner(salon_id));

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.settings (
  key text primary key,
  value text not null
);

create table private.booking_tickets (
  nonce text primary key,
  expires_at timestamptz not null
);

-- ---------------------------------------------------------------------------
-- Yardımcılar
-- ---------------------------------------------------------------------------

create function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.staff where user_id = auth.uid() and active limit 1;
$$;

create function public.can_manage_staff(p_staff_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff st
    where st.id = p_staff_id
      and (
        public.is_salon_owner(st.salon_id)
        or st.user_id = auth.uid()
      )
  );
$$;

create function public.request_client_ip()
returns text
language plpgsql
stable
as $$
declare
  raw_headers text;
  forwarded text;
begin
  raw_headers := current_setting('request.headers', true);
  if raw_headers is null or btrim(raw_headers) = '' then
    return null;
  end if;
  forwarded := coalesce(
    raw_headers::json->>'x-forwarded-for',
    raw_headers::json->>'x-real-ip'
  );
  if forwarded is null or btrim(forwarded) = '' then
    return null;
  end if;
  return left(btrim(split_part(forwarded, ',', 1)), 64);
exception
  when others then
    return null;
end;
$$;

create or replace function public.guard_appointment_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.salon_id is distinct from old.salon_id
    or new.staff_id is distinct from old.staff_id
    or new.service_id is distinct from old.service_id
    or new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at
    or new.created_at is distinct from old.created_at
    or new.manage_token is distinct from old.manage_token
  then
    raise exception 'Randevu zamanı değiştirilemez. İptal edip yeniden oluşturun';
  end if;

  if old.status is distinct from new.status then
    if old.status = 'booked' and new.status in ('done', 'cancelled') then
      if new.status = 'cancelled' then
        perform public.enqueue_booking_notification(new.id, 'booking_cancelled');
      end if;
    elsif old.status = 'blocked' and new.status = 'cancelled' then
      null;
    else
      raise exception 'Bu randevunun durumu değiştirilemez';
    end if;
  end if;

  return new;
end;
$$;

-- Bilet: exp.nonce.hmac  — secret private.settings.booking_ticket_secret
create function private.assert_booking_ticket(p_ticket text)
returns void
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_secret text;
  v_payload text;
  v_nonce text;
  v_sig text;
  v_exp bigint;
  v_expected text;
begin
  select value into v_secret from private.settings where key = 'booking_ticket_secret';
  if v_secret is null or btrim(v_secret) = '' then
    return;
  end if;
  if p_ticket is null or split_part(p_ticket, '.', 3) = '' or split_part(p_ticket, '.', 4) <> '' then
    raise exception 'Doğrulama gerekli. Sayfayı yenileyip tekrar deneyin' using errcode = '28000';
  end if;
  v_exp := split_part(p_ticket, '.', 1)::bigint;
  v_nonce := split_part(p_ticket, '.', 2);
  v_sig := split_part(p_ticket, '.', 3);
  v_payload := split_part(p_ticket, '.', 1) || '.' || v_nonce;
  v_expected := encode(hmac(v_payload, v_secret, 'sha256'), 'hex');
  if v_sig <> v_expected or v_exp < extract(epoch from now()) then
    raise exception 'Doğrulama süresi doldu. Tekrar deneyin' using errcode = '28000';
  end if;
  insert into private.booking_tickets (nonce, expires_at)
  values (v_nonce, to_timestamp(v_exp));
exception
  when unique_violation then
    raise exception 'Bu doğrulama zaten kullanıldı' using errcode = '28000';
  when invalid_text_representation then
    raise exception 'Doğrulama geçersiz' using errcode = '28000';
end;
$$;

create function private.note_booking_attempt()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := public.request_client_ip();
  v_recent integer;
  v_hour integer;
begin
  if v_ip is null then
    return;
  end if;
  delete from public.booking_attempts where created_at < now() - interval '2 hours';
  select count(*) into v_recent
  from public.booking_attempts
  where ip = v_ip and created_at > now() - interval '10 minutes';
  select count(*) into v_hour
  from public.booking_attempts
  where ip = v_ip and created_at > now() - interval '1 hour';
  if v_recent >= 5 or v_hour >= 20 then
    raise exception 'Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin' using errcode = '22023';
  end if;
  insert into public.booking_attempts (ip) values (v_ip);
end;
$$;

-- ---------------------------------------------------------------------------
-- Herkese açık randevu
-- ---------------------------------------------------------------------------

drop function if exists public.book_appointment(text, uuid, uuid, timestamptz, text, text);

create function public.book_appointment(
  p_salon_slug text,
  p_staff_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_consent boolean,
  p_ticket text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_salon public.salons%rowtype;
  v_staff public.staff%rowtype;
  v_service public.services%rowtype;
  v_name text;
  v_phone text;
  v_ends_at timestamptz;
  v_local timestamp;
  v_date date;
  v_today date;
  v_start_minute integer;
  v_end_minute integer;
  v_dow integer;
  v_appt public.appointments%rowtype;
begin
  if coalesce(p_consent, false) is not true then
    raise exception 'Aydınlatma metnini onaylamanız gerekir' using errcode = '22023';
  end if;

  perform private.assert_booking_ticket(p_ticket);
  perform private.note_booking_attempt();

  if p_starts_at is null then
    raise exception 'Saat seçin' using errcode = '22023';
  end if;

  select * into v_salon from public.salons where slug = p_salon_slug;
  if not found then
    raise exception 'Salon bulunamadı' using errcode = 'P0002';
  end if;

  select * into v_staff
  from public.staff
  where id = p_staff_id and salon_id = v_salon.id and active;
  if not found then
    raise exception 'Berber bulunamadı' using errcode = 'P0002';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id and salon_id = v_salon.id and active;
  if not found then
    raise exception 'Hizmet bulunamadı' using errcode = 'P0002';
  end if;

  v_name := regexp_replace(trim(coalesce(p_customer_name, '')), '\s+', ' ', 'g');
  if char_length(v_name) < 2 or char_length(v_name) > 80 or v_name ~ '[0-9<>{}]' then
    raise exception 'Ad soyad 2 ile 80 karakter arasında olmalı' using errcode = '22023';
  end if;

  v_phone := public.normalize_tr_mobile(p_customer_phone);
  if v_phone is null then
    raise exception 'Geçerli bir cep telefonu girin (05xx)' using errcode = '22023';
  end if;

  if p_starts_at < now() + make_interval(mins => 15) then
    raise exception 'Bu saat için çok geç. Daha ileri bir saat seçin' using errcode = '22023';
  end if;

  v_local := p_starts_at at time zone v_salon.timezone;
  v_date := v_local::date;
  v_today := (now() at time zone v_salon.timezone)::date;

  if v_date > v_today + 60 then
    raise exception 'En fazla 60 gün sonrasına randevu alınabilir' using errcode = '22023';
  end if;

  if date_trunc('minute', v_local) <> v_local then
    raise exception 'Geçersiz saat' using errcode = '22023';
  end if;

  v_start_minute := extract(hour from v_local)::integer * 60 + extract(minute from v_local)::integer;
  if v_start_minute % 15 <> 0 then
    raise exception 'Saat 15 dakikalık aralıklara uymalı' using errcode = '22023';
  end if;

  v_end_minute := v_start_minute + v_service.duration_minutes;
  v_dow := extract(dow from v_date)::integer;
  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_minutes);

  if exists (
    select 1 from public.days_off d
    where d.staff_id = v_staff.id and d.off_date = v_date
  ) then
    raise exception 'Berber bu gün izinli' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.working_hours wh
    where wh.staff_id = v_staff.id
      and wh.day_of_week = v_dow
      and wh.start_minute <= v_start_minute
      and wh.end_minute >= v_end_minute
  ) then
    raise exception 'Seçilen saat çalışma saatlerinin dışında' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.appointments a
    where a.salon_id = v_salon.id
      and a.customer_phone = v_phone
      and a.status = 'booked'
      and a.starts_at > now()
  ) >= v_salon.max_active_bookings then
    raise exception 'Bu telefonla daha fazla aktif randevu açılamaz' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.appointments a
    where a.salon_id = v_salon.id
      and a.customer_phone = v_phone
      and a.status = 'booked'
      and (a.starts_at at time zone v_salon.timezone)::date = v_date
  ) >= v_salon.max_daily_bookings then
    raise exception 'Bu telefonla aynı güne daha fazla randevu açılamaz' using errcode = '22023';
  end if;

  begin
    insert into public.appointments (
      salon_id, staff_id, service_id, customer_name, customer_phone,
      starts_at, ends_at, status, consent_at, consent_version
    ) values (
      v_salon.id, v_staff.id, v_service.id, v_name, v_phone,
      p_starts_at, v_ends_at, 'booked', now(), '2026-11-18'
    )
    returning * into v_appt;
  exception
    when exclusion_violation then
      raise exception 'Bu saat az önce doldu. Başka bir saat seçin' using errcode = '23P01';
  end;

  perform public.enqueue_booking_notification(v_appt.id, 'booking_confirmed');

  return jsonb_build_object(
    'id', v_appt.id,
    'starts_at', v_appt.starts_at,
    'ends_at', v_appt.ends_at,
    'customer_name', v_appt.customer_name,
    'service_name', v_service.name,
    'staff_name', v_staff.name,
    'salon_name', v_salon.name,
    'manage_token', v_appt.manage_token
  );
end;
$$;

create function public.get_public_appointment(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if p_token is null or char_length(p_token) < 20 then
    return null;
  end if;
  select
    a.id, a.starts_at, a.ends_at, a.status, a.customer_name,
    s.name as salon_name, s.cancellation_cutoff_hours, s.timezone,
    st.name as staff_name, sv.name as service_name
  into v_row
  from public.appointments a
  join public.salons s on s.id = a.salon_id
  join public.staff st on st.id = a.staff_id
  left join public.services sv on sv.id = a.service_id
  where a.manage_token = p_token
    and a.status <> 'blocked';
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'starts_at', v_row.starts_at,
    'ends_at', v_row.ends_at,
    'status', v_row.status,
    'customer_name', v_row.customer_name,
    'salon_name', v_row.salon_name,
    'staff_name', v_row.staff_name,
    'service_name', v_row.service_name,
    'timezone', v_row.timezone,
    'cancellation_cutoff_hours', v_row.cancellation_cutoff_hours
  );
end;
$$;

create function public.cancel_public_appointment(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
  v_cutoff integer;
begin
  select * into v_appt from public.appointments where manage_token = p_token and status = 'booked';
  if not found then
    raise exception 'İptal edilecek randevu bulunamadı' using errcode = 'P0002';
  end if;
  select cancellation_cutoff_hours into v_cutoff from public.salons where id = v_appt.salon_id;
  if v_appt.starts_at < now() + make_interval(hours => coalesce(v_cutoff, 3)) then
    raise exception 'Bu randevu için iptal süresi doldu' using errcode = '22023';
  end if;
  update public.appointments set status = 'cancelled' where id = v_appt.id;
  return public.get_public_appointment(p_token);
end;
$$;

-- ---------------------------------------------------------------------------
-- Salon içi randevu ve blok
-- ---------------------------------------------------------------------------

create function public.create_manual_appointment(
  p_staff_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff public.staff%rowtype;
  v_service public.services%rowtype;
  v_salon public.salons%rowtype;
  v_name text;
  v_phone text;
  v_local timestamp;
  v_date date;
  v_today date;
  v_start_minute integer;
  v_end_minute integer;
  v_dow integer;
  v_ends timestamptz;
  v_appt public.appointments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapın' using errcode = '28000';
  end if;
  if not public.can_manage_staff(p_staff_id) then
    raise exception 'Bu takvimi düzenleyemezsiniz' using errcode = '42501';
  end if;

  select * into v_staff from public.staff where id = p_staff_id and active;
  if not found then
    raise exception 'Berber bulunamadı' using errcode = 'P0002';
  end if;
  select * into v_salon from public.salons where id = v_staff.salon_id;
  select * into v_service
  from public.services
  where id = p_service_id and salon_id = v_salon.id and active;
  if not found then
    raise exception 'Hizmet bulunamadı' using errcode = 'P0002';
  end if;

  v_name := regexp_replace(trim(coalesce(p_customer_name, '')), '\s+', ' ', 'g');
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Ad soyad 2 ile 80 karakter arasında olmalı' using errcode = '22023';
  end if;
  if p_customer_phone is null or btrim(p_customer_phone) = '' then
    v_phone := null;
  else
    v_phone := public.normalize_tr_mobile(p_customer_phone);
    if v_phone is null then
      raise exception 'Telefon boş bırakılabilir veya 05xx biçiminde olmalıdır' using errcode = '22023';
    end if;
  end if;

  v_local := p_starts_at at time zone v_salon.timezone;
  v_date := v_local::date;
  v_today := (now() at time zone v_salon.timezone)::date;
  if v_date < v_today or v_date > v_today + 60 then
    raise exception 'Tarih bugün ile 60 gün arasında olmalı' using errcode = '22023';
  end if;
  if date_trunc('minute', v_local) <> v_local then
    raise exception 'Geçersiz saat' using errcode = '22023';
  end if;
  v_start_minute := extract(hour from v_local)::integer * 60 + extract(minute from v_local)::integer;
  if v_start_minute % 15 <> 0 then
    raise exception 'Saat 15 dakikalık aralıklara uymalı' using errcode = '22023';
  end if;
  v_end_minute := v_start_minute + v_service.duration_minutes;
  v_dow := extract(dow from v_date)::integer;
  v_ends := p_starts_at + make_interval(mins => v_service.duration_minutes);

  if exists (select 1 from public.days_off d where d.staff_id = v_staff.id and d.off_date = v_date) then
    raise exception 'Berber bu gün izinli' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.working_hours wh
    where wh.staff_id = v_staff.id and wh.day_of_week = v_dow
      and wh.start_minute <= v_start_minute and wh.end_minute >= v_end_minute
  ) then
    raise exception 'Seçilen saat çalışma saatlerinin dışında' using errcode = '22023';
  end if;

  begin
    insert into public.appointments (
      salon_id, staff_id, service_id, customer_name, customer_phone, starts_at, ends_at, status
    ) values (
      v_salon.id, v_staff.id, v_service.id, v_name, v_phone, p_starts_at, v_ends, 'booked'
    ) returning * into v_appt;
  exception
    when exclusion_violation then
      raise exception 'Bu saat dolu' using errcode = '23P01';
  end;

  return jsonb_build_object(
    'id', v_appt.id,
    'manage_token', v_appt.manage_token,
    'starts_at', v_appt.starts_at,
    'ends_at', v_appt.ends_at
  );
end;
$$;

create function public.create_blocked_time(
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_duration_minutes integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff public.staff%rowtype;
  v_salon public.salons%rowtype;
  v_local timestamp;
  v_date date;
  v_today date;
  v_start_minute integer;
  v_end_minute integer;
  v_dow integer;
  v_id uuid;
begin
  if auth.uid() is null or not public.can_manage_staff(p_staff_id) then
    raise exception 'Bu takvimi düzenleyemezsiniz' using errcode = '42501';
  end if;
  if p_duration_minutes is null or p_duration_minutes < 15 or p_duration_minutes > 480 or p_duration_minutes % 15 <> 0 then
    raise exception 'Kapalı süre 15 ile 480 dakika arasında ve 15’in katı olmalı' using errcode = '22023';
  end if;
  select * into v_staff from public.staff where id = p_staff_id and active;
  if not found then
    raise exception 'Berber bulunamadı' using errcode = 'P0002';
  end if;
  select * into v_salon from public.salons where id = v_staff.salon_id;
  v_local := p_starts_at at time zone v_salon.timezone;
  v_date := v_local::date;
  v_today := (now() at time zone v_salon.timezone)::date;
  if v_date < v_today or v_date > v_today + 60 then
    raise exception 'Tarih bugün ile 60 gün arasında olmalı' using errcode = '22023';
  end if;
  v_start_minute := extract(hour from v_local)::integer * 60 + extract(minute from v_local)::integer;
  if v_start_minute % 15 <> 0 or date_trunc('minute', v_local) <> v_local then
    raise exception 'Saat 15 dakikalık aralıklara uymalı' using errcode = '22023';
  end if;
  v_end_minute := v_start_minute + p_duration_minutes;
  v_dow := extract(dow from v_date)::integer;
  if not exists (
    select 1 from public.working_hours wh
    where wh.staff_id = v_staff.id and wh.day_of_week = v_dow
      and wh.start_minute <= v_start_minute and wh.end_minute >= v_end_minute
  ) then
    raise exception 'Kapalı aralık çalışma saatlerinin içinde olmalı' using errcode = '22023';
  end if;
  begin
    insert into public.appointments (
      salon_id, staff_id, service_id, customer_name, customer_phone, starts_at, ends_at, status
    ) values (
      v_salon.id,
      v_staff.id,
      null,
      'Kapalı saat',
      null,
      p_starts_at,
      p_starts_at + make_interval(mins => p_duration_minutes),
      'blocked'
    ) returning id into v_id;
  exception
    when exclusion_violation then
      raise exception 'Bu saat dolu' using errcode = '23P01';
  end;
  return v_id;
end;
$$;

create function public.erase_customer_data(p_phone text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapın' using errcode = '28000';
  end if;
  v_phone := public.normalize_tr_mobile(p_phone);
  if v_phone is null then
    raise exception 'Geçerli bir cep telefonu girin (05xx)' using errcode = '22023';
  end if;
  update public.appointments a
  set customer_name = 'Silinmiş müşteri',
      customer_phone = null,
      customer_erased = true,
      notes = null
  where a.customer_phone = v_phone
    and public.is_salon_owner(a.salon_id)
    and a.customer_erased = false;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Personel daveti
-- ---------------------------------------------------------------------------

create function public.create_staff_invite(p_staff_id uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff public.staff%rowtype;
  v_email text;
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapın' using errcode = '28000';
  end if;
  select * into v_staff from public.staff where id = p_staff_id;
  if not found or not public.is_salon_owner(v_staff.salon_id) then
    raise exception 'Bu personeli davet edemezsiniz' using errcode = '42501';
  end if;
  v_email := lower(btrim(p_email));
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Geçerli bir e-posta girin' using errcode = '22023';
  end if;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.staff_invites (salon_id, staff_id, email, token, expires_at)
  values (v_staff.salon_id, v_staff.id, v_email, v_token, now() + interval '7 days');
  return v_token;
end;
$$;

create function public.preview_staff_invite(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  select i.email, i.expires_at, i.accepted_at, st.name as staff_name, s.name as salon_name
  into v_row
  from public.staff_invites i
  join public.staff st on st.id = i.staff_id
  join public.salons s on s.id = i.salon_id
  where i.token = p_token;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'email', v_row.email,
    'staff_name', v_row.staff_name,
    'salon_name', v_row.salon_name,
    'expires_at', v_row.expires_at,
    'accepted', v_row.accepted_at is not null
  );
end;
$$;

create function public.accept_staff_invite(p_token text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_invite public.staff_invites%rowtype;
begin
  if v_uid is null then
    raise exception 'Giriş yapın' using errcode = '28000';
  end if;
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if p_token is not null then
    select * into v_invite from public.staff_invites where token = p_token;
  else
    select * into v_invite
    from public.staff_invites
    where lower(email) = v_email and accepted_at is null and expires_at > now()
    order by created_at desc
    limit 1;
  end if;
  if not found then
    return null;
  end if;
  if v_invite.accepted_at is not null then
    return v_invite.staff_id;
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Davet süresi dolmuş' using errcode = '22023';
  end if;
  if lower(v_invite.email) <> v_email then
    raise exception 'Bu davet başka bir e-posta için' using errcode = '42501';
  end if;
  update public.staff set user_id = v_uid where id = v_invite.staff_id and user_id is null;
  update public.staff_invites set accepted_at = now() where id = v_invite.id;
  return v_invite.staff_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: personel yalnızca kendi randevusunu görür
-- ---------------------------------------------------------------------------

drop policy if exists appointments_select on public.appointments;
drop policy if exists appointments_update on public.appointments;

create policy appointments_select on public.appointments
  for select to authenticated
  using (
    public.is_salon_owner(salon_id)
    or staff_id = public.current_staff_id()
  );

create policy appointments_update on public.appointments
  for update to authenticated
  using (
    public.is_salon_owner(salon_id)
    or staff_id = public.current_staff_id()
  )
  with check (
    public.is_salon_owner(salon_id)
    or staff_id = public.current_staff_id()
  );

revoke all on function public.current_staff_id() from public;
revoke all on function public.can_manage_staff(uuid) from public;
revoke all on function public.request_client_ip() from public;
revoke all on function public.book_appointment(text, uuid, uuid, timestamptz, text, text, boolean, text) from public;
revoke all on function public.get_public_appointment(text) from public;
revoke all on function public.cancel_public_appointment(text) from public;
revoke all on function public.create_manual_appointment(uuid, uuid, timestamptz, text, text) from public;
revoke all on function public.create_blocked_time(uuid, timestamptz, integer) from public;
revoke all on function public.erase_customer_data(text) from public;
revoke all on function public.create_staff_invite(uuid, text) from public;
revoke all on function public.preview_staff_invite(text) from public;
revoke all on function public.accept_staff_invite(text) from public;

grant execute on function public.current_staff_id() to authenticated;
grant execute on function public.can_manage_staff(uuid) to authenticated;
grant execute on function public.book_appointment(text, uuid, uuid, timestamptz, text, text, boolean, text) to anon, authenticated;
grant execute on function public.get_public_appointment(text) to anon, authenticated;
grant execute on function public.cancel_public_appointment(text) to anon, authenticated;
grant execute on function public.create_manual_appointment(uuid, uuid, timestamptz, text, text) to authenticated;
grant execute on function public.create_blocked_time(uuid, timestamptz, integer) to authenticated;
grant execute on function public.erase_customer_data(text) to authenticated;
grant execute on function public.create_staff_invite(uuid, text) to authenticated;
grant execute on function public.preview_staff_invite(text) to anon, authenticated;
grant execute on function public.accept_staff_invite(text) to authenticated;
