// app/log/_components/LogClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logTasks } from '../actions';
import type { Category } from '@/utils/supabase/types';

type Toast = { kind: 'success' | 'error'; message: string } | null;

// Local 'YYYY-MM-DD' — avoids the UTC off-by-one of toISOString().
function todayISO(): string {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function LogClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const [date, setDate] = useState<string>(todayISO);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast>(null);

  const selectedCount = categories.filter((c) => selected[c.id]).length;

  const toggle = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entries = categories
      .filter((c) => selected[c.id])
      .map((c) => ({
        categoryId: c.id,
        details: (details[c.id] ?? '').trim() || null,
      }));

    if (entries.length === 0) {
      setToast({ kind: 'error', message: 'Selecteer minstens één taak.' });
      return;
    }

    startSaving(async () => {
      const result = await logTasks(date, entries);
      if (result.ok) {
        setToast({
          kind: 'success',
          message: 'Taken opgeslagen. Agenda wordt geopend…',
        });
        // Let the success toast register, then return to the dashboard.
        router.push('/');
        router.refresh();
      } else {
        setToast({ kind: 'error', message: result.error });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={
            toast.kind === 'success'
              ? 'rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
              : 'rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
          }
        >
          {toast.message}
        </div>
      )}

      {/* Date */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <label
          htmlFor="log-date"
          className="text-sm font-semibold text-slate-900"
        >
          Datum
        </label>
        <input
          id="log-date"
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 sm:w-56"
        />
      </section>

      {/* Tasks */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Taken</h2>
          <span className="text-xs font-medium text-slate-500">
            {selectedCount} geselecteerd
          </span>
        </header>

        <ul className="divide-y divide-slate-100">
          {categories.map((category) => {
            const isSelected = !!selected[category.id];
            return (
              <li key={category.id} className="px-5 py-3">
                <button
                  type="button"
                  onClick={() => toggle(category.id)}
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? 'inline-flex items-center gap-2 rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700'
                      : 'inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-teal-400 hover:text-teal-700'
                  }
                >
                  <span
                    aria-hidden
                    className={
                      isSelected
                        ? 'flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]'
                        : 'flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] text-transparent'
                    }
                  >
                    ✓
                  </span>
                  {category.name}
                </button>

                {isSelected && (
                  <input
                    type="text"
                    value={details[category.id] ?? ''}
                    onChange={(e) =>
                      setDetails((prev) => ({
                        ...prev,
                        [category.id]: e.target.value,
                      }))
                    }
                    maxLength={300}
                    placeholder="Optionele details (bijv. t/m letter Gz)"
                    className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-slate-500">
          {selectedCount === 0
            ? 'Nog niets geselecteerd'
            : `${selectedCount} ${selectedCount === 1 ? 'taak' : 'taken'} geselecteerd`}
        </span>
        <button
          type="submit"
          disabled={isSaving || selectedCount === 0}
          className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Bezig met opslaan…' : 'Taak voltooid'}
        </button>
      </div>
    </form>
  );
}
