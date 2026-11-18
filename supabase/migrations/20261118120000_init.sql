-- Berber randevu: salon, personel, hizmet, çalışma saatleri ve randevular.
-- Saat hesabı Europe/Istanbul yerel saatine göredir ve packages/shared slot kurallarıyla aynıdır:
-- 15 dk ızgara, 15 dk hazırlık payı, en fazla 60 gün, yarı açık aralık [başlangıç, bitiş).

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tablolar
-- ---------------------------------------------------------------------------

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  phone text,
  address text,
  city text,
  description text,
  timezone text not null default 'Europe/Istanbul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salons_name_check check (char_length(trim(name)) between 2 and 80),
  constraint salons_slug_check check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$'),
  constraint salons_timezone_check check (timezone = 'Europe/Istanbul')
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  name text not null,
  duration_minutes integer not null,
  price_kurus integer not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_check check (char_length(trim(name)) between 2 and 80),
  constraint services_duration_check check (duration_minutes between 5 and 480),
  constraint services_price_check check (price_kurus >= 0 and price_kurus <= 100000000)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  name text not null,
  title text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_name_check check (char_length(trim(name)) between 2 and 80)
);

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  day_of_week smallint not null,
  start_minute smallint not null,
  end_minute smallint not null,
  constraint working_hours_day_check check (day_of_week between 0 and 6),
  constraint working_hours_range_check check (
    start_minute >= 0
    and end_minute <= 1440
    and end_minute > start_minute
  ),
  constraint working_hours_no_overlap exclude using gist (
    staff_id with =,
    day_of_week with =,
    int4range(start_minute, end_minute, '[)') with &&
  )
);

create table public.days_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  off_date date not null,
  reason text,
  unique (staff_id, off_date)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_status_check check (status in ('booked', 'done', 'cancelled')),
  constraint appointments_time_check check (ends_at > starts_at),
  constraint appointments_name_check check (char_length(trim(customer_name)) between 2 and 80),
  constraint appointments_phone_check check (customer_phone ~ '^05[0-9]{9}$'),
  constraint appointments_no_overlap exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled')
);

comment on constraint appointments_no_overlap on public.appointments is
  'Aynı personelde iptal edilmemiş randevular çakışamaz. Yarış durumunda da geçerlidir.';

-- Bildirimler bu sürümde gönderilmez. Kanal açıldığında book_appointment kuyruğa yazar;
-- bir sonraki sürümde bir worker bu tabloyu okuyup SMS, WhatsApp veya e-posta iletir.
create table public.notification_settings (
  salon_id uuid primary key references public.salons (id) on delete cascade,
  sms_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  email_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  channel text not null,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint notification_channel_check check (channel in ('sms', 'whatsapp', 'email')),
  constraint notification_status_check check (status in ('pending', 'sent', 'failed', 'skipped')),
  constraint notification_template_check check (
    template_key in ('booking_confirmed', 'booking_cancelled', 'reminder')
  )
);

comment on table public.notification_outbox is
  'Gelecekteki SMS/WhatsApp/e-posta gönderimi için kuyruk. Bu sürümde worker yoktur.';

create index services_salon_idx on public.services (salon_id, active, sort_order);
create index staff_salon_idx on public.staff (salon_id, active);
create index working_hours_staff_idx on public.working_hours (staff_id, day_of_week);
create index days_off_staff_date_idx on public.days_off (staff_id, off_date);
create index appointments_salon_start_idx on public.appointments (salon_id, starts_at);
create index appointments_staff_active_idx
  on public.appointments (staff_id, starts_at)
  where status <> 'cancelled';

-- ---------------------------------------------------------------------------
-- Yardımcılar
-- ---------------------------------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger salons_touch before update on public.salons
  for each row execute function public.touch_updated_at();
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();
create trigger staff_touch before update on public.staff
  for each row execute function public.touch_updated_at();
create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();

create function public.slugify(input text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := trim(coalesce(input, ''));
  s := replace(s, 'İ', 'i');
  s := replace(s, 'I', 'i');
  s := replace(s, 'ı', 'i');
  s := replace(s, 'Ç', 'c');
  s := replace(s, 'ç', 'c');
  s := replace(s, 'Ğ', 'g');
  s := replace(s, 'ğ', 'g');
  s := replace(s, 'Ö', 'o');
  s := replace(s, 'ö', 'o');
  s := replace(s, 'Ş', 's');
  s := replace(s, 'ş', 's');
  s := replace(s, 'Ü', 'u');
  s := replace(s, 'ü', 'u');
  s := replace(s, 'Â', 'a');
  s := replace(s, 'â', 'a');
  s := replace(s, 'Î', 'i');
  s := replace(s, 'î', 'i');
  s := replace(s, 'Û', 'u');
  s := replace(s, 'û', 'u');
  s := lower(s);
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  if s is null or s = '' then
    s := 'salon';
  end if;
  if char_length(s) > 48 then
    s := regexp_replace(left(s, 48), '-+$', '', 'g');
  end if;
  if char_length(s) < 3 then
    s := left(s || '-salon', 48);
  end if;
  return s;
end;
$$;

create function public.normalize_tr_mobile(input text)
returns text
language plpgsql
immutable
as $$
declare
  d text;
begin
  d := regexp_replace(coalesce(input, ''), '\D', '', 'g');
  if d ~ '^90[0-9]{10}$' then
    d := '0' || substr(d, 3);
  elsif d ~ '^5[0-9]{9}$' then
    d := '0' || d;
  end if;
  if d ~ '^05[0-9]{9}$' then
    return d;
  end if;
  return null;
end;
$$;

create function public.is_salon_owner(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.salons s
    where s.id = p_salon_id
      and s.owner_id = auth.uid()
  );
$$;

create function public.staff_salon_id(p_staff_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select salon_id from public.staff where id = p_staff_id;
$$;

-- Yeni personele pazartesi–cumartesi 09:00–19:00 yazar. Pazar kapalıdır.
create function public.seed_staff_hours()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.working_hours (staff_id, day_of_week, start_minute, end_minute)
  select new.id, day_num, 9 * 60, 19 * 60
  from generate_series(1, 6) as day_num;
  return new;
end;
$$;

create trigger staff_seed_hours
  after insert on public.staff
  for each row execute function public.seed_staff_hours();

create function public.enqueue_booking_notification(
  p_appointment_id uuid,
  p_template text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
  v_settings public.notification_settings%rowtype;
  v_channel text;
begin
  select * into v_appt from public.appointments where id = p_appointment_id;
  if not found then
    return;
  end if;

  select * into v_settings
  from public.notification_settings
  where salon_id = v_appt.salon_id;

  -- Satır yoksa veya tüm kanallar kapalıysa kuyruğa bir şey yazılmaz.
  if not found then
    return;
  end if;

  foreach v_channel in array array['sms', 'whatsapp', 'email']
  loop
    if (v_channel = 'sms' and v_settings.sms_enabled)
      or (v_channel = 'whatsapp' and v_settings.whatsapp_enabled)
      or (v_channel = 'email' and v_settings.email_enabled)
    then
      insert into public.notification_outbox (appointment_id, channel, template_key, payload)
      values (
        v_appt.id,
        v_channel,
        p_template,
        jsonb_build_object(
          'customer_name', v_appt.customer_name,
          'customer_phone', v_appt.customer_phone,
          'starts_at', v_appt.starts_at,
          'ends_at', v_appt.ends_at,
          'salon_id', v_appt.salon_id
        )
      );
    end if;
  end loop;
end;
$$;

create function public.guard_appointment_update()
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
  then
    raise exception 'Randevu zamanı değiştirilemez. İptal edip yeniden oluşturun';
  end if;

  if old.status is distinct from new.status then
    if old.status <> 'booked' or new.status not in ('done', 'cancelled') then
      raise exception 'Bu randevunun durumu değiştirilemez';
    end if;
    if new.status = 'cancelled' then
      perform public.enqueue_booking_notification(new.id, 'booking_cancelled');
    end if;
  end if;

  return new;
end;
$$;

create trigger appointments_guard
  before update on public.appointments
  for each row execute function public.guard_appointment_update();

create function public.guard_salon_owner()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.owner_id is distinct from old.owner_id then
    raise exception 'Salon sahibi değiştirilemez';
  end if;
  if new.timezone is distinct from 'Europe/Istanbul' then
    raise exception 'Saat dilimi Europe/Istanbul olmalıdır';
  end if;
  return new;
end;
$$;

create trigger salons_guard
  before insert or update on public.salons
  for each row execute function public.guard_salon_owner();

-- Kayıt olan kullanıcının salonunu oluşturur. İstemci ayrıca salon eklemek zorunda kalmaz.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_slug text;
  v_suffix text;
begin
  v_name := trim(coalesce(new.raw_user_meta_data ->> 'salon_name', ''));
  if char_length(v_name) < 2 then
    v_name := 'Salonum';
  end if;
  if char_length(v_name) > 80 then
    v_name := left(v_name, 80);
  end if;

  v_slug := public.slugify(v_name);
  if exists (select 1 from public.salons where slug = v_slug) then
    v_suffix := substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
    v_slug := public.slugify(v_name || '-' || v_suffix);
  end if;

  begin
    insert into public.salons (owner_id, name, slug)
    values (new.id, v_name, v_slug);
  exception
    when unique_violation then
      insert into public.salons (owner_id, name, slug)
      values (
        new.id,
        v_name,
        public.slugify(v_name || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
      );
  end;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Herkese açık okuma: dolu saatler, müşteri adı olmadan
-- ---------------------------------------------------------------------------

create function public.get_salon_busy_ranges(
  p_slug text,
  p_from date,
  p_to date
)
returns table (staff_id uuid, starts_at timestamptz, ends_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_salon public.salons%rowtype;
  v_today date;
begin
  if p_from is null or p_to is null or p_to < p_from or p_to > p_from + 61 then
    return;
  end if;

  select * into v_salon from public.salons where slug = p_slug;
  if not found then
    return;
  end if;

  v_today := (now() at time zone v_salon.timezone)::date;
  if p_from < v_today - 1 or p_to > v_today + 60 then
    return;
  end if;

  return query
  select a.staff_id, a.starts_at, a.ends_at
  from public.appointments a
  join public.staff st on st.id = a.staff_id
  where st.salon_id = v_salon.id
    and st.active
    and a.status <> 'cancelled'
    and a.starts_at < ((p_to + 1)::timestamp at time zone v_salon.timezone)
    and a.ends_at > (p_from::timestamp at time zone v_salon.timezone);
end;
$$;

-- ---------------------------------------------------------------------------
-- Randevu oluşturma. Çakışma hem burada hem exclusion constraint ile kesilir.
-- ---------------------------------------------------------------------------

create function public.book_appointment(
  p_salon_slug text,
  p_staff_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
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
  ) >= 3 then
    raise exception 'Bu telefonla en fazla 3 aktif randevu olabilir' using errcode = '22023';
  end if;

  begin
    insert into public.appointments (
      salon_id,
      staff_id,
      service_id,
      customer_name,
      customer_phone,
      starts_at,
      ends_at,
      status
    ) values (
      v_salon.id,
      v_staff.id,
      v_service.id,
      v_name,
      v_phone,
      p_starts_at,
      v_ends_at,
      'booked'
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
    'salon_name', v_salon.name
  );
end;
$$;

-- Personelin haftalık saatlerini tek işlemde değiştirir. Silme ve ekleme aynı transaction'dadır.
create function public.replace_working_hours(p_staff_id uuid, p_hours jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id uuid;
  v_item jsonb;
  v_day integer;
  v_start integer;
  v_end integer;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapın' using errcode = '28000';
  end if;

  v_salon_id := public.staff_salon_id(p_staff_id);
  if v_salon_id is null or not public.is_salon_owner(v_salon_id) then
    raise exception 'Bu personeli düzenleyemezsiniz' using errcode = '42501';
  end if;

  if p_hours is null or jsonb_typeof(p_hours) <> 'array' then
    raise exception 'Çalışma saatleri liste olmalı' using errcode = '22023';
  end if;

  if jsonb_array_length(p_hours) > 14 then
    raise exception 'Bir günde en fazla iki aralık girin' using errcode = '22023';
  end if;

  delete from public.working_hours where staff_id = p_staff_id;

  for v_item in select value from jsonb_array_elements(p_hours)
  loop
    v_day := (v_item ->> 'day_of_week')::integer;
    v_start := (v_item ->> 'start_minute')::integer;
    v_end := (v_item ->> 'end_minute')::integer;
    v_count := v_count + 1;
    if v_day < 0 or v_day > 6 or v_start < 0 or v_end > 1440 or v_end <= v_start then
      raise exception 'Çalışma saati aralığı geçersiz' using errcode = '22023';
    end if;
    insert into public.working_hours (staff_id, day_of_week, start_minute, end_minute)
    values (p_staff_id, v_day::smallint, v_start::smallint, v_end::smallint);
  end loop;
end;
$$;

-- App Store, hesap oluşturan uygulamalarda hesap silmeyi zorunlu tutar.
create function public.delete_owner_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Giriş yapın' using errcode = '28000';
  end if;

  delete from public.appointments
  where salon_id in (select id from public.salons where owner_id = v_uid);

  delete from public.salons where owner_id = v_uid;
  delete from auth.users where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.salons enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.working_hours enable row level security;
alter table public.days_off enable row level security;
alter table public.appointments enable row level security;
alter table public.notification_settings enable row level security;
alter table public.notification_outbox enable row level security;

create policy salons_select on public.salons
  for select to anon, authenticated
  using (true);

create policy salons_update on public.salons
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy services_select on public.services
  for select to anon, authenticated
  using (active = true or public.is_salon_owner(salon_id));

create policy services_insert on public.services
  for insert to authenticated
  with check (public.is_salon_owner(salon_id));

create policy services_update on public.services
  for update to authenticated
  using (public.is_salon_owner(salon_id))
  with check (public.is_salon_owner(salon_id));

create policy services_delete on public.services
  for delete to authenticated
  using (public.is_salon_owner(salon_id));

create policy staff_select on public.staff
  for select to anon, authenticated
  using (active = true or public.is_salon_owner(salon_id));

create policy staff_insert on public.staff
  for insert to authenticated
  with check (public.is_salon_owner(salon_id));

create policy staff_update on public.staff
  for update to authenticated
  using (public.is_salon_owner(salon_id))
  with check (public.is_salon_owner(salon_id));

create policy staff_delete on public.staff
  for delete to authenticated
  using (public.is_salon_owner(salon_id));

create policy working_hours_select on public.working_hours
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.staff st
      where st.id = working_hours.staff_id
        and (st.active or public.is_salon_owner(st.salon_id))
    )
  );

create policy working_hours_insert on public.working_hours
  for insert to authenticated
  with check (public.is_salon_owner(public.staff_salon_id(staff_id)));

create policy working_hours_update on public.working_hours
  for update to authenticated
  using (public.is_salon_owner(public.staff_salon_id(staff_id)))
  with check (public.is_salon_owner(public.staff_salon_id(staff_id)));

create policy working_hours_delete on public.working_hours
  for delete to authenticated
  using (public.is_salon_owner(public.staff_salon_id(staff_id)));

create policy days_off_select on public.days_off
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.staff st
      where st.id = days_off.staff_id
        and (st.active or public.is_salon_owner(st.salon_id))
    )
  );

create policy days_off_insert on public.days_off
  for insert to authenticated
  with check (public.is_salon_owner(public.staff_salon_id(staff_id)));

create policy days_off_delete on public.days_off
  for delete to authenticated
  using (public.is_salon_owner(public.staff_salon_id(staff_id)));

-- Randevu satırları müşteri bilgisi taşır. Doğrudan ekleme yoktur; book_appointment kullanılır.
create policy appointments_select on public.appointments
  for select to authenticated
  using (public.is_salon_owner(salon_id));

create policy appointments_update on public.appointments
  for update to authenticated
  using (public.is_salon_owner(salon_id))
  with check (public.is_salon_owner(salon_id));

-- ---------------------------------------------------------------------------
-- Yetkiler
-- ---------------------------------------------------------------------------

revoke all on public.notification_settings from anon, authenticated;
revoke all on public.notification_outbox from anon, authenticated;
revoke all on public.appointments from anon;
revoke insert, delete on public.appointments from authenticated;
grant select, update on public.appointments to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.enqueue_booking_notification(uuid, text) from public;
revoke all on function public.guard_appointment_update() from public;
revoke all on function public.seed_staff_hours() from public;
revoke all on function public.delete_owner_account() from public;
revoke all on function public.replace_working_hours(uuid, jsonb) from public;
revoke all on function public.book_appointment(text, uuid, uuid, timestamptz, text, text) from public;
revoke all on function public.get_salon_busy_ranges(text, date, date) from public;
revoke all on function public.is_salon_owner(uuid) from public;
revoke all on function public.staff_salon_id(uuid) from public;

grant execute on function public.is_salon_owner(uuid) to anon, authenticated;
grant execute on function public.staff_salon_id(uuid) to authenticated;
grant execute on function public.book_appointment(text, uuid, uuid, timestamptz, text, text) to anon, authenticated;
grant execute on function public.get_salon_busy_ranges(text, date, date) to anon, authenticated;
grant execute on function public.delete_owner_account() to authenticated;
grant execute on function public.replace_working_hours(uuid, jsonb) to authenticated;
grant execute on function public.slugify(text) to anon, authenticated;
grant execute on function public.normalize_tr_mobile(text) to anon, authenticated;
