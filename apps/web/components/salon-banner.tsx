import { formatSalonAddress, formatSalonPhone, instagramUrl, toTelHref, type Salon } from "@berber/shared";

export function SalonBanner({
  salon,
  logoUrl,
  coverUrl,
}: {
  salon: Pick<
    Salon,
    "name" | "address" | "district" | "city" | "phone" | "description" | "maps_url" | "instagram" | "hours_summary"
  >;
  logoUrl: string | null;
  coverUrl: string | null;
}) {
  const place = formatSalonAddress(salon);
  const phoneLabel = salon.phone ? formatSalonPhone(salon.phone) : null;

  return (
    <header className="mb-6">
      {coverUrl ? (
        <img src={coverUrl} alt="" className="mb-4 h-40 w-full rounded-3xl object-cover" />
      ) : null}
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bark font-serif text-2xl text-card">
            {salon.name.slice(0, 1)}
          </div>
        )}
        <div>
          <h1 className="font-serif text-4xl leading-none">{salon.name}</h1>
          {place ? <p className="mt-1 text-sm text-muted">{place}</p> : null}
        </div>
      </div>
      {salon.description ? <p className="mt-4 text-sm leading-6">{salon.description}</p> : null}
      {salon.hours_summary ? <p className="mt-2 text-sm text-muted">{salon.hours_summary}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
        {phoneLabel && salon.phone ? (
          <a className="rounded-full bg-clay px-4 py-2 text-card" href={toTelHref(salon.phone)}>
            Ara · {phoneLabel}
          </a>
        ) : null}
        {salon.maps_url ? (
          <a className="rounded-full border border-line bg-card px-4 py-2" href={salon.maps_url} target="_blank" rel="noreferrer">
            Haritada aç
          </a>
        ) : null}
        {salon.instagram ? (
          <a
            className="rounded-full border border-line bg-card px-4 py-2"
            href={instagramUrl(salon.instagram)}
            target="_blank"
            rel="noreferrer"
          >
            @{salon.instagram}
          </a>
        ) : null}
      </div>
    </header>
  );
}
