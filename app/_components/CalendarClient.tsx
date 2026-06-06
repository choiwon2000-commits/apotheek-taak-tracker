// app/_components/CalendarClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { TaskWithCategory } from '@/utils/supabase/types';

// Nederlandse labels; week begint op maandag.
const MONTHS_NL = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];
const DAYS_SHORT_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAYS_FULL_NL = [
  'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag',
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

function fullDayLabel(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${cap(DAYS_FULL_NL[weekdayIndex(iso)])} ${d}/${m}`;
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

// "08:30" uit een ISO-timestamp (lokale tijd).
function timeLabel(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined${className ? ` ${className}` : ''}`} aria-hidden>
      {name}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
      <div className={`flex items-center gap-sm ${accent}`}>
        <Icon name={icon} />
        <h4 className="text-headline-sm text-on-surface">{label}</h4>
      </div>
      <p className="text-display-lg text-on-surface">{value}</p>
      <p className="text-label-md text-secondary">{sub}</p>
    </div>
  );
}

type DayGroup = { id: string; name: string; icon: string | null; items: TaskWithCategory[] };

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

  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskWithCategory[]> = {};
    for (const t of tasks) (map[t.date] ??= []).push(t);
    return map;
  }, [tasks]);

  // Echte statistieken uit de data van deze maand.
  const stats = useMemo(() => {
    const activeDays = Object.keys(tasksByDate).length;
    const counts = new Map<string, number>();
    for (const t of tasks) {
      counts.set(t.category.name, (counts.get(t.category.name) ?? 0) + 1);
    }
    let topName = '—';
    let topCount = 0;
    for (const [name, c] of counts) {
      if (c > topCount) {
        topName = name;
        topCount = c;
      }
    }
    return { total: tasks.length, activeDays, topName, topCount };
  }, [tasks, tasksByDate]);

  const cells = useMemo(() => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const out: (number | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, monthIndex]);

  const isoFor = (day: number) => `${monthISO}-${String(day).padStart(2, '0')}`;
  const today = todayISO();
  const title = `${cap(MONTHS_NL[monthIndex])} ${year}`;

  useEffect(() => {
    if (!selectedDate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDate(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedDate]);

  const selectedGroups: DayGroup[] = useMemo(() => {
    if (!selectedDate) return [];
    const dayTasks = tasksByDate[selectedDate] ?? [];
    const byCat = new Map<string, DayGroup>();
    for (const t of dayTasks) {
      const group =
        byCat.get(t.category.id) ?? {
          id: t.category.id,
          name: t.category.name,
          icon: t.category.icon,
          items: [],
        };
      group.items.push(t);
      byCat.set(t.category.id, group);
    }
    return [...byCat.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedDate, tasksByDate]);

  return (
    <div className="space-y-xl">
      {/* Statistiekkaarten */}
      <section className="grid grid-cols-1 gap-lg md:grid-cols-3">
        <StatCard
          icon="assignment_turned_in"
          label="Gelogd"
          value={String(stats.total)}
          sub="Taken gelogd deze maand"
          accent="text-primary"
        />
        <StatCard
          icon="event_available"
          label="Actieve dagen"
          value={String(stats.activeDays)}
          sub="Dagen met minstens één log"
          accent="text-tertiary"
        />
        <StatCard
          icon="trending_up"
          label="Meest gelogd"
          value={stats.topCount > 0 ? String(stats.topCount) : '—'}
          sub={stats.topCount > 0 ? stats.topName : 'Nog geen taken'}
          accent="text-primary"
        />
      </section>

      {/* Kalender */}
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
        {/* Navigatie */}
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest p-md">
          <Link
            href={`/?month=${shiftMonth(monthISO, -1)}`}
            aria-label="Vorige maand"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <Icon name="chevron_left" />
          </Link>
          <div className="flex items-center gap-md">
            <h3 className="text-headline-sm text-on-surface">{title}</h3>
            <Link
              href={`/?month=${today.slice(0, 7)}`}
              className="rounded-lg bg-surface-container-low px-3 py-1.5 text-label-md text-secondary transition-colors hover:bg-surface-container-high"
            >
              Vandaag
            </Link>
          </div>
          <Link
            href={`/?month=${shiftMonth(monthISO, 1)}`}
            aria-label="Volgende maand"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <Icon name="chevron_right" />
          </Link>
        </div>

        {/* Weekdagen */}
        <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
          {DAYS_SHORT_NL.map((d) => (
            <div
              key={d}
              className="py-sm text-center text-label-sm uppercase tracking-wider text-secondary"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Dagen */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return (
                <div
                  key={`blank-${i}`}
                  className="min-h-[72px] border-b border-r border-outline-variant bg-surface-container-low/40 last:border-r-0 md:min-h-[112px]"
                />
              );
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
                  'flex min-h-[72px] flex-col gap-1 border-b border-r border-outline-variant p-1.5 text-left align-top transition-colors last:border-r-0 md:min-h-[112px] md:p-2',
                  hasTasks
                    ? 'cursor-pointer bg-surface-container-lowest hover:bg-surface-container-high'
                    : 'cursor-default bg-surface-container-lowest/60',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-label-md',
                    isToday
                      ? 'bg-primary font-bold text-on-primary'
                      : 'text-on-surface',
                  ].join(' ')}
                >
                  {day}
                </span>

                {/* Mobiel: stippen. Desktop: categorie-chips. */}
                {hasTasks && (
                  <>
                    <div className="flex flex-wrap gap-1 md:hidden">
                      {dayTasks.slice(0, 4).map((t) => (
                        <span
                          key={t.id}
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                    <div className="hidden flex-col gap-0.5 md:flex">
                      {dayTasks.slice(0, 2).map((t) => (
                        <span
                          key={t.id}
                          className="truncate rounded bg-primary-container px-1.5 py-0.5 text-[10px] font-medium leading-tight text-on-primary-container"
                          title={t.category.name}
                        >
                          {t.category.name}
                        </span>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="px-1 text-[10px] font-medium text-secondary">
                          +{dayTasks.length - 2} meer
                        </span>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dag-detail popup */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-on-surface/50 p-0 backdrop-blur-sm sm:items-center sm:p-md"
          onClick={() => setSelectedDate(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Taken voor ${fullDayLabel(selectedDate)}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[28rem] overflow-hidden rounded-t-2xl border border-outline-variant bg-surface shadow-xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-outline-variant p-lg">
              <h3 className="text-headline-md text-on-surface">
                {fullDayLabel(selectedDate)}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label="Sluiten"
                className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="close" />
              </button>
            </header>

            <div className="flex max-h-[70vh] flex-col gap-md overflow-y-auto p-lg">
              {selectedGroups.map((group) =>
                group.items.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-md rounded-xl border border-outline-variant bg-surface-container-low p-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                      <Icon name={group.icon || 'task'} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-label-md text-on-surface">
                        {group.name}
                      </p>
                      {t.details && (
                        <p className="mt-0.5 text-body-md text-on-surface-variant">
                          {t.details}
                        </p>
                      )}
                      <p className="mt-1 text-label-sm font-normal tracking-normal text-secondary">
                        Gelogd om {timeLabel(t.created_at)}
                        {t.logged_by ? ` door ${t.logged_by}` : ''}
                      </p>
                    </div>
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
