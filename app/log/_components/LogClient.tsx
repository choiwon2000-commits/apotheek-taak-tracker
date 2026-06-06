// app/log/_components/LogClient.tsx
'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logTasks } from '../actions';
import type { Category, Person } from '@/utils/supabase/types';

type Toast = { kind: 'success' | 'error'; message: string } | null;

function todayISO(): string {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

function Icon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span className={`material-symbols-outlined${filled ? ' filled' : ''}`} aria-hidden>
      {name}
    </span>
  );
}

export function LogClient({
  categories,
  people,
}: {
  categories: Category[];
  people: Person[];
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const [date, setDate] = useState<string>(todayISO);
  const [person, setPerson] = useState<string>('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast>(null);
  const [scan, setScan] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  const selectedCount = categories.filter((c) => selected[c.id]).length;

  // Barcode -> categorie (voor snelle herkenning bij scannen).
  const byBarcode = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of categories) {
      if (c.barcode) m.set(c.barcode.trim().toLowerCase(), c);
    }
    return m;
  }, [categories]);

  const toast2 = (t: Toast) => {
    setToast(t);
    if (t) window.setTimeout(() => setToast(null), 2500);
  };

  const toggle = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  // Handscanner "typt" de code en drukt op Enter.
  const handleScan = () => {
    const code = scan.trim();
    setScan('');
    if (!code) return;
    const match = byBarcode.get(code.toLowerCase());
    if (match) {
      setSelected((prev) => ({ ...prev, [match.id]: true }));
      toast2({ kind: 'success', message: `✓ ${match.name}` });
    } else {
      toast2({ kind: 'error', message: `Onbekende barcode: ${code}` });
    }
    scanRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) {
      toast2({ kind: 'error', message: 'Kies een persoon.' });
      return;
    }
    const entries = categories
      .filter((c) => selected[c.id])
      .map((c) => ({
        categoryId: c.id,
        details: (details[c.id] ?? '').trim() || null,
      }));
    if (entries.length === 0) {
      toast2({ kind: 'error', message: 'Selecteer of scan minstens één taak.' });
      return;
    }
    startSaving(async () => {
      const result = await logTasks(date, entries, person);
      if (result.ok) {
        toast2({ kind: 'success', message: 'Taken opgeslagen. Kalender wordt geopend…' });
        router.push('/');
        router.refresh();
      } else {
        toast2({ kind: 'error', message: result.error });
      }
    });
  };

  const fieldCls =
    'h-touch-target rounded-lg border border-outline-variant bg-surface px-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  const noPeople = people.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-lg">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={
            toast.kind === 'success'
              ? 'rounded-lg border border-primary/30 bg-primary-container px-md py-3 text-label-md text-on-primary-container'
              : 'rounded-lg border border-error/30 bg-error-container px-md py-3 text-label-md text-on-error-container'
          }
        >
          {toast.message}
        </div>
      )}

      {/* Datum + persoon */}
      <section className="grid grid-cols-1 gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm sm:grid-cols-2">
        <div className="flex flex-col gap-xs">
          <label htmlFor="log-date" className="text-label-md text-on-surface-variant">
            Datum
          </label>
          <input
            id="log-date"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label htmlFor="log-person" className="text-label-md text-on-surface-variant">
            Persoon
          </label>
          {noPeople ? (
            <p className="rounded-lg border border-outline-variant bg-surface px-md py-2.5 text-label-md text-secondary">
              Voeg eerst personen toe in{' '}
              <a href="/admin" className="font-medium text-primary underline">
                Beheer
              </a>
              .
            </p>
          ) : (
            <select
              id="log-person"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className={`${fieldCls} appearance-none`}
            >
              <option value="">Kies een persoon…</option>
              {people.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {/* Barcode scannen */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
        <label htmlFor="scan" className="text-label-md text-on-surface-variant">
          Barcode scannen
        </label>
        <div className="mt-xs flex items-center gap-sm rounded-lg border border-outline-variant bg-surface px-md focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Icon name="barcode_scanner" />
          <input
            id="scan"
            ref={scanRef}
            type="text"
            value={scan}
            autoFocus
            onChange={(e) => setScan(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleScan();
              }
            }}
            placeholder="Scan een barcode (of typ + Enter)"
            className="h-touch-target flex-1 bg-transparent font-mono text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          />
        </div>
        <p className="mt-xs text-label-sm font-normal tracking-normal text-secondary">
          De gescande taak wordt automatisch aangevinkt in de lijst hieronder.
        </p>
      </section>

      {/* Taken */}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <header className="flex items-center justify-between border-b border-outline-variant px-lg py-md">
          <h2 className="text-headline-sm text-on-surface">Taken</h2>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
            {selectedCount} geselecteerd
          </span>
        </header>

        <ul className="divide-y divide-outline-variant">
          {categories.map((category) => {
            const isSelected = !!selected[category.id];
            return (
              <li key={category.id} className="px-lg py-md">
                <button
                  type="button"
                  onClick={() => toggle(category.id)}
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? 'flex w-full items-center gap-md rounded-lg bg-primary-container p-3 text-left text-on-primary-container transition-colors'
                      : 'flex w-full items-center gap-md rounded-lg border border-outline-variant bg-surface p-3 text-left text-on-surface transition-colors hover:bg-surface-container-high'
                  }
                >
                  <span
                    className={
                      isSelected
                        ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-on-primary-container/15'
                        : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant'
                    }
                  >
                    <Icon name={category.icon || 'task'} filled={isSelected} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-md">{category.name}</span>
                    {category.description && (
                      <span
                        className={
                          isSelected
                            ? 'block truncate text-label-sm font-normal tracking-normal text-on-primary-container/80'
                            : 'block truncate text-label-sm font-normal tracking-normal text-secondary'
                        }
                      >
                        {category.description}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0">
                    <Icon name={isSelected ? 'check_circle' : 'radio_button_unchecked'} />
                  </span>
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
                    className="mt-sm block w-full min-w-0 rounded-lg border border-outline-variant bg-surface px-md py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex items-center justify-end gap-md">
        <span className="text-label-sm font-normal tracking-normal text-secondary">
          {selectedCount === 0
            ? 'Nog niets geselecteerd'
            : `${selectedCount} ${selectedCount === 1 ? 'taak' : 'taken'} geselecteerd`}
        </span>
        <button
          type="submit"
          disabled={isSaving || selectedCount === 0 || noPeople}
          className="flex h-touch-target items-center justify-center gap-sm rounded-xl bg-primary px-lg text-label-md text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name={isSaving ? 'progress_activity' : 'check'} />
          {isSaving ? 'Bezig met opslaan…' : 'Opslaan'}
        </button>
      </div>
    </form>
  );
}
