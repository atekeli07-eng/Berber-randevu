"use client";

import { addCalendarDays, weekdayIndex } from "@berber/shared";
import { useMemo, useState } from "react";
import { cx } from "./ui";

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];
const HEADS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function shiftMonth(date: string, delta: number): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function MonthCalendar({
  today,
  selected,
  onSelect,
  isAvailable,
}: {
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
  isAvailable: (date: string) => boolean;
}) {
  const [visible, setVisible] = useState(monthStart(selected ?? today));
  const cells = useMemo(() => {
    const lead = (weekdayIndex(visible) + 6) % 7;
    const days: Array<string | null> = Array.from({ length: lead }, () => null);
    let cursor = visible;
    while (cursor.slice(0, 7) === visible.slice(0, 7)) {
      days.push(cursor);
      cursor = addCalendarDays(cursor, 1);
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [visible]);

  const title = `${MONTHS[Number(visible.slice(5, 7)) - 1]} ${visible.slice(0, 4)}`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="h-10 rounded-full px-3 text-sm" onClick={() => setVisible(shiftMonth(visible, -1))}>
          ←
        </button>
        <p className="font-serif text-lg">{title}</p>
        <button type="button" className="h-10 rounded-full px-3 text-sm" onClick={() => setVisible(shiftMonth(visible, 1))}>
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {HEADS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;
          const available = isAvailable(date);
          const isSelected = date === selected;
          return (
            <button
              key={date}
              type="button"
              disabled={!available}
              onClick={() => onSelect(date)}
              className={cx(
                "h-10 rounded-full text-sm",
                isSelected && "bg-clay text-card",
                !isSelected && available && "hover:bg-paper",
                !available && "text-muted/40",
                date === today && !isSelected && "ring-1 ring-gold",
              )}
            >
              {Number(date.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
