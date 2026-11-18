-- Salon aboneliği: 30 gün deneme, havale ile aylık ücret, kurucu onayı.
-- Kart ödemesi (iyzico / PayTR) için payments.method = 'card' ve provider alanı hazırdır.
-- Eski migrasyonlar değiştirilmez. Üretimde bu dosya tek başına çalıştırılır.

-- ---------------------------------------------------------------------------
-- Platform ayarı: tek satır
-- ---------------------------------------------------------------------------

create table public.platform_settings (
  id integer primary key default 1,
  monthly_price_kurus integer not null default 0,
  iban text not null default '',
  account_holder text not null default '',
  bank_name text not null default '',
  trial_days integer not null default 30,
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id = 1),
  constraint platform_settings_price_check check (monthly_price_kurus between 0 and 100000000),
  constraint platform_settings_trial_check check (trial_days between 0 and 365),
  constraint platform_settings_iban_check check (char_length(iban) <= 34),
  constraint platform_settings_holder_check check (char_length(account_holder) <= 120),
  constraint platform_settings_bank_check check (char_length(bank_name) <= 80)
);

insert into public.platform_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Kurucu hesapları
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  constraint platform_admins_email_check check (position('@' in email) > 1)
);

create unique index platform_admins_email_key on public.platform_admins (lower(email));

-- ---------------------------------------------------------------------------
-- Salon abonelik alanları
-- ---------------------------------------------------------------------------

alter table public.salons
  add column trial_ends_at timestamptz,
  add column paid_until timestamptz,
  add column suspended boolean not null default false,
  add column payment_code text;

update public.salons
set trial_ends_at = now() + interval '30 days'
where trial_ends_at is null;

update public.salons
set payment_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
where payment_code is null;

alter table public.salons
  alter column trial_ends_at set not null,
  alter column payment_code set not null;

alter table public.salons
  add constraint salons_payment_code_key unique (payment_code);

create function public.assign_salon_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer;
begin
  if new.trial_ends_at is null then
    select trial_days into v_days from public.platform_settings where id = 1;
    if v_days is null then
      v_days := 30;
    end if;
    new.trial_ends_at := now() + make_interval(days => v_days);
  end if;
  if new.payment_code is null or btrim(new.payment_code) = '' then
    new.payment_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  end if;
  return new;
end;
$$;

create trigger salons_assign_billing
  before insert on public.salons
  for each row execute function public.assign_salon_billing();

-- ---------------------------------------------------------------------------
-- Ödemeler. method card sonraki kart aboneliği içindir.
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  method text not null,
  provider text,
  amount_kurus integer not null,
  currency text not null default 'TRY',
  period_months integer not null default 1,
  status text not null,
  reference text not null,
  note text,
  reported_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payments_method_check check (method in ('bank_transfer', 'card')),
  constraint payments_provider_check check (provider is null or provider in ('iyzico', 'paytr')),
  constraint payments_amount_check check (amount_kurus between 0 and 100000000),
  constraint payments_currency_check check (currency = 'TRY'),
  constraint payments_period_check check (period_months between 1 and 24),
  constraint payments_status_check check (status in ('pending', 'approved', 'rejected', 'failed')),
  constraint payments_note_check check (note is null or char_length(note) <= 500),
  constraint payments_reference_check check (char_length(reference) between 4 and 40)
);

create index payments_salon_status_idx on public.payments (salon_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Durum hesabı. Veritabanı ve packages/shared aynı sırayı kullanır.
-- ---------------------------------------------------------------------------

create function public.salon_subscription_status(
  p_trial timestamptz,
  p_paid timestamptz,
  p_suspended boolean,
  p_now timestamptz default now()
)
returns text
language sql
stable
as $$
  select case
    when coalesce(p_suspended, false) then 'suspended'
    when p_paid is not null and p_paid > p_now then 'active'
    when p_trial is not null and p_trial > p_now then 'trial'
    when p_trial is null then 'trial'
    else 'past_due'
  end;
$$;

create function public.salon_is_bookable(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.salon_subscription_status(s.trial_ends_at, s.paid_until, s.suspended) in ('trial', 'active')
  from public.salons s
  where s.id = p_salon_id;
$$;

create function public.extend_paid_until(
  p_paid timestamptz,
  p_months integer,
  p_now timestamptz default now()
)
returns timestamptz
language sql
stable
as $$
  select greatest(coalesce(p_paid, p_now), p_now) + make_interval(months => p_months);
$$;

-- Yeni randevu, süre dolmuş veya askıdaki salona yazılamaz. book_appointment da bu tetikleyiciden geçer.
create function public.reject_closed_salon_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.salon_is_bookable(new.salon_id) then
    raise exception 'Bu salon şu anda online randevu almıyor' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger appointments_require_subscription
  before insert on public.appointments
  for each row execute function public.reject_closed_salon_booking();

-- ---------------------------------------------------------------------------
-- Kurucu yetkisi
-- ---------------------------------------------------------------------------

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

create function public.grant_platform_admin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id uuid;
begin
  if position('@' in v_email) < 2 then
    raise exception 'Geçerli bir e-posta yazın' using errcode = '22023';
  end if;
  select id into v_id from auth.users where lower(email) = v_email limit 1;
  if v_id is null then
    raise exception 'Bu e-posta ile kullanıcı yok. Önce siteden kayıt olun.' using errcode = 'P0002';
  end if;
  insert into public.platform_admins (user_id, email)
  values (v_id, v_email)
  on conflict (user_id) do update set email = excluded.email;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Salon sahibi: havale bildirimi
-- ---------------------------------------------------------------------------

create function public.report_bank_transfer(p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon public.salons%rowtype;
  v_amount integer;
  v_note text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapın' using errcode = '28000';
  end if;
  select * into v_salon from public.salons where owner_id = auth.uid();
  if not found then
    raise exception 'Yalnızca salon sahibi ödeme bildirebilir' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.payments
    where salon_id = v_salon.id and status = 'pending'
  ) then
    raise exception 'Bekleyen bir bildiriminiz var' using errcode = '22023';
  end if;
  select monthly_price_kurus into v_amount from public.platform_settings where id = 1;
  if coalesce(v_amount, 0) <= 0 then
    raise exception 'Aylık ücret henüz belirlenmedi' using errcode = '22023';
  end if;
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'Not en fazla 500 karakter olabilir' using errcode = '22023';
  end if;
  insert into public.payments (
    salon_id, method, amount_kurus, period_months, status, reference, note, reported_at
  ) values (
    v_salon.id, 'bank_transfer', v_amount, 1, 'pending', v_salon.payment_code, v_note, now()
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Kurucu işlemleri
-- ---------------------------------------------------------------------------

create function public.admin_update_billing_settings(
  p_monthly_price_kurus integer,
  p_iban text,
  p_account_holder text,
  p_bank_name text,
  p_trial_days integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_iban text := upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g'));
  v_holder text := btrim(coalesce(p_account_holder, ''));
  v_bank text := btrim(coalesce(p_bank_name, ''));
begin
  if not public.is_platform_admin() then
    raise exception 'Bu işlem yalnızca kurucuya açıktır' using errcode = '42501';
  end if;
  if p_monthly_price_kurus is null or p_monthly_price_kurus < 0 or p_monthly_price_kurus > 100000000 then
    raise exception 'Aylık ücret geçersiz' using errcode = '22023';
  end if;
  if p_trial_days is null or p_trial_days < 0 or p_trial_days > 365 then
    raise exception 'Deneme süresi 0 ile 365 gün arasında olmalı' using errcode = '22023';
  end if;
  if v_iban <> '' and v_iban !~ '^TR[0-9]{24}$' then
    raise exception 'IBAN TR ile başlamalı ve 26 karakter olmalı' using errcode = '22023';
  end if;
  if char_length(v_holder) > 120 or char_length(v_bank) > 80 then
    raise exception 'Banka bilgisi çok uzun' using errcode = '22023';
  end if;
  update public.platform_settings
  set monthly_price_kurus = p_monthly_price_kurus,
      iban = v_iban,
      account_holder = v_holder,
      bank_name = v_bank,
      trial_days = p_trial_days,
      updated_at = now()
  where id = 1;
end;
$$;

create function public.approve_salon_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'Bu işlem yalnızca kurucuya açıktır' using errcode = '42501';
  end if;
  select * into v_payment from public.payments where id = p_payment_id and status = 'pending';
  if not found then
    raise exception 'Bekleyen ödeme bulunamadı' using errcode = 'P0002';
  end if;
  update public.payments
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_payment_id;
  update public.salons
  set paid_until = public.extend_paid_until(paid_until, v_payment.period_months)
  where id = v_payment.salon_id;
end;
$$;

create function public.admin_extend_salon(
  p_salon_id uuid,
  p_months integer,
  p_amount_kurus integer,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon public.salons%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Bu işlem yalnızca kurucuya açıktır' using errcode = '42501';
  end if;
  if p_months is null or p_months < 1 or p_months > 24 then
    raise exception 'Ay sayısı 1 ile 24 arasında olmalı' using errcode = '22023';
  end if;
  if p_amount_kurus is null or p_amount_kurus < 0 then
    raise exception 'Tutar geçersiz' using errcode = '22023';
  end if;
  select * into v_salon from public.salons where id = p_salon_id;
  if not found then
    raise exception 'Salon bulunamadı' using errcode = 'P0002';
  end if;
  insert into public.payments (
    salon_id, method, amount_kurus, period_months, status, reference, note, reported_at, reviewed_at, reviewed_by
  ) values (
    v_salon.id, 'bank_transfer', p_amount_kurus, p_months, 'approved', v_salon.payment_code,
    v_note, now(), now(), auth.uid()
  )
  returning id into v_id;
  update public.salons
  set paid_until = public.extend_paid_until(paid_until, p_months)
  where id = v_salon.id;
  return v_id;
end;
$$;

create function public.admin_set_suspended(p_salon_id uuid, p_suspended boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Bu işlem yalnızca kurucuya açıktır' using errcode = '42501';
  end if;
  update public.salons
  set suspended = coalesce(p_suspended, false)
  where id = p_salon_id;
  if not found then
    raise exception 'Salon bulunamadı' using errcode = 'P0002';
  end if;
end;
$$;

create function public.get_public_plan()
returns table (monthly_price_kurus integer, trial_days integer)
language sql
stable
security definer
set search_path = public
as $$
  select monthly_price_kurus, trial_days
  from public.platform_settings
  where id = 1;
$$;

create function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_month_start timestamptz;
begin
  if not public.is_platform_admin() then
    raise exception 'Bu işlem yalnızca kurucuya açıktır' using errcode = '42501';
  end if;
  v_month_start := date_trunc('month', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
  return jsonb_build_object(
    'total', (select count(*) from public.salons),
    'trial', (
      select count(*) from public.salons s
      where public.salon_subscription_status(s.trial_ends_at, s.paid_until, s.suspended) = 'trial'
    ),
    'active', (
      select count(*) from public.salons s
      where public.salon_subscription_status(s.trial_ends_at, s.paid_until, s.suspended) = 'active'
    ),
    'past_due', (
      select count(*) from public.salons s
      where public.salon_subscription_status(s.trial_ends_at, s.paid_until, s.suspended) = 'past_due'
    ),
    'suspended', (
      select count(*) from public.salons s
      where public.salon_subscription_status(s.trial_ends_at, s.paid_until, s.suspended) = 'suspended'
    ),
    'pending_payments', (select count(*) from public.payments where status = 'pending'),
    'month_revenue_kurus', (
      select coalesce(sum(amount_kurus), 0)
      from public.payments
      where status = 'approved' and reviewed_at >= v_month_start
    )
  );
end;
$$;

create function public.admin_salon_rows()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Bu işlem yalnızca kurucuya açıktır' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.created_at desc)
    from (
      select
        s.id,
        s.name,
        s.slug,
        s.phone,
        s.payment_code,
        s.created_at,
        s.trial_ends_at,
        s.paid_until,
        s.suspended,
        u.email as owner_email,
        public.salon_subscription_status(s.trial_ends_at, s.paid_until, s.suspended) as status,
        (
          select max(p.reviewed_at)
          from public.payments p
          where p.salon_id = s.id and p.status = 'approved'
        ) as last_payment_at,
        (
          select count(*)::integer
          from public.payments p
          where p.salon_id = s.id and p.status = 'pending'
        ) as pending_count
      from public.salons s
      left join auth.users u on u.id = s.owner_id
    ) x
  ), '[]'::jsonb);
end;
$$;

create function public.admin_salon_payments(p_salon_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Bu işlem yalnızca kurucuya açıktır' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(p) order by p.created_at desc)
    from (
      select id, method, provider, amount_kurus, period_months, status, reference, note,
             reported_at, reviewed_at, created_at
      from public.payments
      where salon_id = p_salon_id
    ) p
  ), '[]'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.platform_settings enable row level security;
alter table public.platform_admins enable row level security;
alter table public.payments enable row level security;

create policy platform_settings_read on public.platform_settings
  for select to authenticated
  using (true);

create policy payments_owner_read on public.payments
  for select to authenticated
  using (
    public.is_salon_owner(salon_id)
    or public.is_platform_admin()
  );

revoke all on function public.grant_platform_admin(text) from public, anon, authenticated;
revoke all on function public.assign_salon_billing() from public;
revoke all on function public.reject_closed_salon_booking() from public;
revoke all on function public.extend_paid_until(timestamptz, integer, timestamptz) from public;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.salon_subscription_status(timestamptz, timestamptz, boolean, timestamptz) to anon, authenticated;
grant execute on function public.salon_is_bookable(uuid) to anon, authenticated;
grant execute on function public.report_bank_transfer(text) to authenticated;
grant execute on function public.admin_update_billing_settings(integer, text, text, text, integer) to authenticated;
grant execute on function public.approve_salon_payment(uuid) to authenticated;
grant execute on function public.admin_extend_salon(uuid, integer, integer, text) to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;
grant execute on function public.get_public_plan() to anon, authenticated;
grant execute on function public.admin_dashboard() to authenticated;
grant execute on function public.admin_salon_rows() to authenticated;
grant execute on function public.admin_salon_payments(uuid) to authenticated;
