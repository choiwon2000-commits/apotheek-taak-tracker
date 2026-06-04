// app/_components/CalendarClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { TaskWithCategory } from '@/utils/supabase/types';

// Dutch labels for the pharmacy-facing calendar; week starts on Monday.
const MONTHS_NL = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];
const DAYS_SHORT_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAYS_FULL_NL = [
  'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag',
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Monday-based weekday index (0 = Monday … 6 = Sunday) for a 'YYYY-MM-DD'.
function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

// "1/6" — day/month without leading zeros.
function dayMonthLabel(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d}/${m}`;
}

// "Maandag 1/6"
function fullDayLabel(iso: string): string {
  return `${cap(DAYS_FULL_NL[weekdayIndex(iso)])} ${dayMonthLabel(iso)}`;
}

function shiftMonth(monthISO: string, delta: number): string {
  const [y, m] = monthISO.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayISO(): string {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

type DayGroup = { id: string; name: string; items: TaskWithCategory[] };

export function CalendarClient({
  monthISO,
  tasks,
}: {
  monthISO: string;
  tasks: TaskWithCategory[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [year, monthIndex] = useMemo(() => {
    const [y, m] = monthISO.split('-').map(Number);
    return [y, m - 1] as const;
  }, [monthISO]);

  // Map each date -> its tasks (already ordered by the server query).
  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskWithCategory[]> = {};
    for (const t of tasks) {
      (map[t.date] ??= []).push(t);
    }
    return map;
  }, [tasks]);

  // Calendar cells: leading blanks for the first week, then each day number.
  const cells = useMemo(() => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const out: (number | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, monthIndex]);

  const isoFor = (day: number) =>
    `${monthISO}-${String(day).padStart(2, '0')}`;

  const today = todayISO();
  const title = `${cap(MONTHS_NL[monthIndex])} ${year}`;
  const hasAnyTasks = tasks.length > 0;

  // Close the day modal with Escape.
  useEffect(() => {
    if (!selectedDate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDate(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedDate]);

  // Group the selected day's tasks by category for the detail view.
  const selectedGroups: DayGroup[] = useMemo(() => {
    if (!selectedDate) return [];
    const dayTasks = tasksByDate[selectedDate] ?? [];
    const byCat = new Map<string, DayGroup>();
    for (const t of dayTasks) {
      const group = byCat.get(t.category.id) ?? {
        id: t.category.id,
        name: t.category.name,
        items: [],
      };
      group.items.push(t);
      byCat.set(t.category.id, group);
    }
    return [...byCat.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedDate, tasksByDate]);

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="flex items-center gap-1">
          <Link
            href={`/?month=${shiftMonth(monthISO, -1)}`}
            aria-label="Previous month"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            ‹
          </Link>
          <Link
            href={`/?month=${todayISO().slice(0, 7)}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Today
          </Link>
          <Link
            href={`/?month=${shiftMonth(monthISO, 1)}`}
            aria-label="Next month"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            ›
          </Link>
        </div>
      </div>

      {/* Desktop: month grid */}
      <div className="hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:block">
        <div className="grid grid-cols-7 gap-1">
          {DAYS_SHORT_NL.map((d) => (
            <div
              key={d}
              className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              {d}
            </div>
          ))}

          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`blank-${i}`} className="min-h-24 rounded-md" />;
            }
            const iso = isoFor(day);
            const dayTasks = tasksByDate[iso] ?? [];
            const isToday = iso === today;
            const hasTasks = dayTasks.length > 0;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => hasTasks && setSelectedDate(iso)}
                disabled={!hasTasks}
                className={[
                  'min-h-24 rounded-md border p-1.5 text-left align-top transition',
                  hasTasks
                    ? 'cursor-pointer border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40'
                    : 'cursor-default border-slate-100 bg-slate-50/40',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    isToday
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-500',
                  ].join(' ')}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="truncate rounded bg-teal-50 px-1.5 py-0.5 text-[11px] font-medium text-teal-700"
                      title={t.category.name}
                    >
                      {t.category.name}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="px-1.5 text-[11px] font-medium text-slate-400">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: list of days that have logs */}
      <div className="space-y-2 sm:hidden">
        {!hasAnyTasks ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            No tasks logged this month.
          </div>
        ) : (
          Object.keys(tasksByDate)
            .sort()
            .map((iso) => {
              const dayTasks = tasksByDate[iso];
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-400"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {fullDayLabel(iso)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {dayTasks.map((t) => t.category.name).join(', ')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    {dayTasks.length}
                  </span>
                </button>
              );
            })
        )}
      </div>

      {/* Desktop empty state */}
      {!hasAnyTasks && (
        <p className="mt-4 hidden text-center text-sm text-slate-500 sm:block">
          No tasks logged this month.
        </p>
      )}

      {/* Day detail modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Tasks for ${fullDayLabel(selectedDate)}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {fullDayLabel(selectedDate)}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label="Close"
                className="rounded-md px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </header>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {selectedGroups.map((group) => (
                  <li key={group.id}>
                    <p className="text-sm font-semibold text-teal-700">
                      {group.name}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {group.items.map((t) => (
                        <li key={t.id} className="text-sm text-slate-700">
                          {t.details ?? (
                            <span className="text-slate-400">No details</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
