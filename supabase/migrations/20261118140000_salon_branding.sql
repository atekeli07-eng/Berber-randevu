-- Salon kimliği: adres parçaları, harita, Instagram, saat özeti ve görseller.
-- Görseller salon-media kovasında {salon_id}/logo.webp ve {salon_id}/cover.webp olarak durur.

alter table public.salons
  add column district text,
  add column maps_url text,
  add column instagram text,
  add column hours_summary text,
  add column logo_path text,
  add column cover_path text;

update public.salons
set description = left(description, 500)
where description is not null and char_length(description) > 500;

update public.salons
set address = left(address, 160)
where address is not null and char_length(address) > 160;

create function public.normalize_salon_phone(input text)
returns text
language plpgsql
immutable
as $$
declare
  d text;
begin
  d := regexp_replace(coalesce(input, ''), '\D', '', 'g');
  if d = '' then
    return null;
  end if;
  if d ~ '^90[0-9]{10}$' then
    d := '0' || substr(d, 3);
  elsif d ~ '^5[0-9]{9}$' then
    d := '0' || d;
  end if;
  if d ~ '^0[0-9]{10}$' then
    return d;
  end if;
  return null;
end;
$$;

update public.salons
set phone = public.normalize_salon_phone(phone)
where phone is not null;

alter table public.salons
  add constraint salons_phone_check check (phone is null or phone ~ '^0[0-9]{10}$'),
  add constraint salons_address_check check (address is null or char_length(address) between 2 and 160),
  add constraint salons_district_check check (district is null or char_length(district) between 2 and 80),
  add constraint salons_city_check check (city is null or char_length(city) between 2 and 80),
  add constraint salons_description_check check (description is null or char_length(description) <= 500),
  add constraint salons_hours_summary_check check (hours_summary is null or char_length(hours_summary) <= 160),
  add constraint salons_instagram_check check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  add constraint salons_maps_check check (
    maps_url is null
    or (
      char_length(maps_url) <= 500
      and (
        maps_url ~ '^https://(www\.)?google\.[a-z.]+/maps'
        or maps_url ~ '^https://maps\.google\.[a-z.]+/'
        or maps_url ~ '^https://maps\.app\.goo\.gl/'
        or maps_url ~ '^https://goo\.gl/maps'
      )
    )
  ),
  add constraint salons_logo_path_check check (
    logo_path is null or logo_path ~ '^[0-9a-fA-F-]{36}/logo\.(webp|jpg)$'
  ),
  add constraint salons_cover_path_check check (
    cover_path is null or cover_path ~ '^[0-9a-fA-F-]{36}/cover\.(webp|jpg)$'
  );

-- Yükleme yolu salonun kendi klasörü mü?
create function public.salon_media_path_owned(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  folder text;
begin
  folder := split_part(coalesce(object_name, ''), '/', 1);
  if folder !~ '^[0-9a-fA-F-]{36}$' then
    return false;
  end if;
  if split_part(object_name, '/', 2) !~ '^(logo|cover)\.(webp|jpg)$' then
    return false;
  end if;
  if split_part(object_name, '/', 3) <> '' then
    return false;
  end if;
  return public.is_salon_owner(folder::uuid);
end;
$$;

revoke all on function public.salon_media_path_owned(text) from public;
revoke all on function public.normalize_salon_phone(text) from public;
grant execute on function public.salon_media_path_owned(text) to authenticated;
grant execute on function public.normalize_salon_phone(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'salon-media',
  'salon-media',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy salon_media_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'salon-media');

create policy salon_media_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'salon-media'
  and public.salon_media_path_owned(name)
);

create policy salon_media_owner_update
on storage.objects
for update
to authenticated
using (bucket_id = 'salon-media' and public.salon_media_path_owned(name))
with check (bucket_id = 'salon-media' and public.salon_media_path_owned(name));

create policy salon_media_owner_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'salon-media' and public.salon_media_path_owned(name));

-- Hesap silinince salon klasöründeki görseller de gider.
create or replace function public.delete_owner_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  v_uid uuid := auth.uid();
  v_salon uuid;
begin
  if v_uid is null then
    raise exception 'Giriş yapın' using errcode = '28000';
  end if;

  select id into v_salon from public.salons where owner_id = v_uid;
  if v_salon is not null then
    delete from storage.objects
    where bucket_id = 'salon-media'
      and name like v_salon::text || '/%';
  end if;

  delete from public.appointments
  where salon_id in (select id from public.salons where owner_id = v_uid);

  delete from public.salons where owner_id = v_uid;
  delete from auth.users where id = v_uid;
end;
$$;
