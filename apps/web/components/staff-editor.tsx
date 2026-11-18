"use client";

import {
  WEEKDAYS,
  formatMinuteOfDay,
  normalizePersonName,
  parseMinuteOfDay,
  type DayOff,
  type Staff,
  type WorkingHour,
} from "@berber/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Card, Field, Notice, inputClass } from "./ui";

type Shift = { start: string; end: string };
type DayState = { enabled: boolean; first: Shift; second: Shift | null };

function initialDays(hours: WorkingHour[]): DayState[] {
  return WEEKDAYS.map((day) => {
    const rows = hours
      .filter((hour) => hour.day_of_week === day.value)
      .sort((a, b) => a.start_minute - b.start_minute);
    const first = rows[0];
    const second = rows[1];
    return {
      enabled: rows.length > 0,
      first: {
        start: formatMinuteOfDay(first?.start_minute ?? 9 * 60),
        end: formatMinuteOfDay(first?.end_minute ?? 19 * 60),
      },
      second: second
        ? { start: formatMinuteOfDay(second.start_minute), end: formatMinuteOfDay(second.end_minute) }
        : null,
    };
  });
}

export function StaffEditor({
  staff,
  hours,
  daysOff,
}: {
  staff: Staff;
  hours: WorkingHour[];
  daysOff: DayOff[];
}) {
  const router = useRouter();
  const [name, setName] = useState(staff.name);
  const [title, setTitle] = useState(staff.title ?? "");
  const [active, setActive] = useState(staff.active);
  const [days, setDays] = useState(() => initialDays(hours));
  const [offDate, setOffDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const orderedOff = useMemo(
    () => [...daysOff].sort((a, b) => a.off_date.localeCompare(b.off_date)),
    [daysOff],
  );

  function updateDay(index: number, patch: Partial<DayState>) {
    setDays((current) => current.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const clean = normalizePersonName(name);
    if (!clean) {
      setError("Ad en az 2 harf olmalı.");
      return;
    }
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase
      .from("staff")
      .update({ name: clean, title: title.trim() || null, active })
      .eq("id", staff.id);
    if (updateError) {
      setError(translateError(updateError));
      return;
    }
    setInfo("Personel kaydedildi.");
    setError(null);
    router.refresh();
  }

  async function saveHours() {
    const payload: Array<{ day_of_week: number; start_minute: number; end_minute: number }> = [];
    for (let index = 0; index < WEEKDAYS.length; index += 1) {
      const day = days[index];
      const meta = WEEKDAYS[index];
      if (!day || !meta || !day.enabled) continue;
      const shifts = [day.first, ...(day.second ? [day.second] : [])];
      for (const shift of shifts) {
        const start = parseMinuteOfDay(shift.start.slice(0, 5));
        const end = parseMinuteOfDay(shift.end.slice(0, 5));
        if (start === null || end === null || end <= start) {
          setError(`${meta.long} saatleri geçersiz.`);
          return;
        }
        payload.push({ day_of_week: meta.value, start_minute: start, end_minute: end });
      }
    }
    const supabase = createBrowserSupabase();
    const { error: rpcError } = await supabase.rpc("replace_working_hours", {
      p_staff_id: staff.id,
      p_hours: payload,
    });
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    setError(null);
    setInfo("Çalışma saatleri güncellendi.");
    router.refresh();
  }

  async function addOff(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(offDate)) {
      setError("İzin günü seçin.");
      return;
    }
    const supabase = createBrowserSupabase();
    const { error: insertError } = await supabase.from("days_off").insert({
      staff_id: staff.id,
      off_date: offDate,
      reason: reason.trim() || null,
    });
    if (insertError) {
      setError(translateError(insertError));
      return;
    }
    setOffDate("");
    setReason("");
    setError(null);
    router.refresh();
  }

  async function removeOff(id: string) {
    const supabase = createBrowserSupabase();
    const { error: deleteError } = await supabase.from("days_off").delete().eq("id", id);
    if (deleteError) {
      setError(translateError(deleteError));
      return;
    }
    router.refresh();
  }

  async function removeStaff() {
    const supabase = createBrowserSupabase();
    const { error: deleteError } = await supabase.from("staff").delete().eq("id", staff.id);
    if (deleteError) {
      setError(translateError(deleteError));
      return;
    }
    router.push("/panel/personel");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">{staff.name}</h1>
        <p className="text-sm text-muted">Haftalık saatler ve izin günleri randevu ızgarasını belirler.</p>
      </div>
      {error ? <Notice>{error}</Notice> : null}
      {info ? <Notice tone="good">{info}</Notice> : null}
      <Card>
        <form onSubmit={saveProfile} className="space-y-3">
          <Field label="Ad">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Ünvan">
            <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
            Randevuya açık
          </label>
          <Button type="submit">Kaydet</Button>
        </form>
      </Card>
      <Card className="space-y-4">
        <h2 className="font-serif text-2xl">Haftalık saatler</h2>
        <p className="text-sm text-muted">Öğle arası için ikinci aralığı açın. Aralıklar çakışmamalı.</p>
        {WEEKDAYS.map((meta, index) => {
          const day = days[index];
          if (!day) return null;
          return (
            <div key={meta.value} className="rounded-2xl border border-line p-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(event) => updateDay(index, { enabled: event.target.checked })}
                />
                {meta.long}
              </label>
              {day.enabled ? (
                <div className="mt-3 space-y-2">
                  <ShiftFields
                    shift={day.first}
                    onChange={(first) => updateDay(index, { first })}
                  />
                  {day.second ? (
                    <ShiftFields shift={day.second} onChange={(second) => updateDay(index, { second })} />
                  ) : null}
                  <button
                    type="button"
                    className="text-sm font-semibold text-clay"
                    onClick={() =>
                      updateDay(index, {
                        second: day.second ? null : { start: "13:00", end: "19:00" },
                      })
                    }
                  >
                    {day.second ? "İkinci aralığı kaldır" : "Öğle arası ekle"}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted">Bu gün kapalı.</p>
              )}
            </div>
          );
        })}
        <Button type="button" onClick={saveHours}>
          Saatleri kaydet
        </Button>
      </Card>
      <Card>
        <h2 className="font-serif text-2xl">İzin günleri</h2>
        <form onSubmit={addOff} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label="Tarih">
            <input className={inputClass} type="date" value={offDate} onChange={(event) => setOffDate(event.target.value)} />
          </Field>
          <Field label="Not">
            <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="İzin" />
          </Field>
          <Button type="submit">Ekle</Button>
        </form>
        <ul className="mt-4 divide-y divide-line">
          {orderedOff.length === 0 ? <li className="py-3 text-sm text-muted">İzin günü yok.</li> : null}
          {orderedOff.map((day) => (
            <li key={day.id} className="flex items-center justify-between py-3 text-sm">
              <span>
                {day.off_date}
                {day.reason ? ` · ${day.reason}` : ""}
              </span>
              <button type="button" className="font-semibold text-bad" onClick={() => removeOff(day.id)}>
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Button type="button" variant="danger" onClick={removeStaff}>
        Personeli sil
      </Button>
    </div>
  );
}

function ShiftFields({ shift, onChange }: { shift: Shift; onChange: (shift: Shift) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input className={inputClass} type="time" value={shift.start} onChange={(event) => onChange({ ...shift, start: event.target.value })} />
      <input className={inputClass} type="time" value={shift.end} onChange={(event) => onChange({ ...shift, end: event.target.value })} />
    </div>
  );
}
