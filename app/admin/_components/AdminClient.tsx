// app/admin/_components/AdminClient.tsx
'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { addCategory, deleteCategory } from '../actions';
import type { Category } from '@/utils/supabase/types';

type OptimisticAction =
  | { type: 'add'; category: Category }
  | { type: 'delete'; id: string };

type Toast = { kind: 'success' | 'error'; message: string } | null;

// Iconen die het personeel kan kiezen (Material Symbols).
const ICON_OPTIONS = [
  'medication', 'inventory_2', 'clinical_notes', 'cleaning_services',
  'vaccines', 'thermostat', 'local_shipping', 'science',
  'receipt_long', 'support_agent', 'event', 'task',
];

function Icon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span className={`material-symbols-outlined${filled ? ' filled' : ''}`} aria-hidden>
      {name}
    </span>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-lg flex h-touch-target w-full items-center justify-center gap-sm rounded-xl bg-primary text-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon name="add" />
      {pending ? 'Opslaan…' : 'Opslaan'}
    </button>
  );
}

export function AdminClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [optimisticCategories, dispatchOptimistic] = useOptimistic<
    Category[],
    OptimisticAction
  >(initialCategories, (state, action) => {
    if (action.type === 'add') {
      return [...state, action.category].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }
    if (action.type === 'delete') {
      return state.filter((c) => c.id !== action.id);
    }
    return state;
  });

  const [isDeleting, startDeleteTransition] = useTransition();
  const [toast, setToast] = useState<Toast>(null);
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    if (t) window.setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (formData: FormData) => {
    const raw = formData.get('name');
    const name = typeof raw === 'string' ? raw.trim() : '';
    if (!name) {
      showToast({ kind: 'error', message: 'Voer een categorienaam in.' });
      return;
    }

    const description =
      (formData.get('description') as string | null)?.trim() || null;

    dispatchOptimistic({
      type: 'add',
      category: {
        id: `temp-${crypto.randomUUID()}`,
        name,
        description,
        icon,
        created_at: new Date().toISOString(),
      },
    });
    formRef.current?.reset();
    setIcon(ICON_OPTIONS[0]);
    inputRef.current?.focus();

    const result = await addCategory(formData);
    if (result.ok) {
      showToast({ kind: 'success', message: `"${name}" toegevoegd.` });
    } else {
      showToast({ kind: 'error', message: result.error });
    }
  };

  const handleDelete = (category: Category) => {
    if (
      !window.confirm(
        `"${category.name}" verwijderen?\n\nAlle gelogde taken die deze categorie gebruikten worden ook verwijderd.`,
      )
    ) {
      return;
    }

    startDeleteTransition(async () => {
      dispatchOptimistic({ type: 'delete', id: category.id });
      const result = await deleteCategory(category.id);
      if (result.ok) {
        showToast({ kind: 'success', message: `"${category.name}" verwijderd.` });
      } else {
        showToast({ kind: 'error', message: result.error });
      }
    });
  };

  return (
    <div className="space-y-lg">
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

      <div className="grid grid-cols-1 gap-xl lg:grid-cols-12">
        {/* Categorie-kaarten */}
        <div className="space-y-gutter lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md text-on-surface">Huidige taken</h2>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
              {optimisticCategories.length} actief
            </span>
          </div>

          {optimisticCategories.length === 0 ? (
            <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center text-body-md text-secondary">
              Nog geen categorieën. Voeg er rechts een toe.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              {optimisticCategories.map((category) => {
                const isOptimistic = category.id.startsWith('temp-');
                return (
                  <div
                    key={category.id}
                    className="group rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-md flex items-start justify-between">
                      <div className="rounded-lg bg-primary-container p-2 text-on-primary-container">
                        <Icon name={category.icon || 'task'} filled />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        disabled={isDeleting || isOptimistic}
                        aria-label={`Verwijder ${category.name}`}
                        className="flex h-touch-target w-touch-target items-center justify-center rounded-full text-error opacity-0 transition-all hover:bg-error-container group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30 max-md:opacity-100"
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                    <h3 className="text-headline-sm text-on-surface">
                      {category.name}
                      {isOptimistic && (
                        <span className="ml-2 text-label-sm font-normal tracking-normal text-secondary">
                          opslaan…
                        </span>
                      )}
                    </h3>
                    {category.description && (
                      <p className="mt-xs line-clamp-2 text-body-md text-on-surface-variant">
                        {category.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Toevoegformulier + export */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm">
            <h2 className="mb-lg text-headline-sm text-on-surface">
              Categorie toevoegen
            </h2>
            <form ref={formRef} action={handleAdd} className="space-y-md">
              <input type="hidden" name="icon" value={icon} />

              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant">
                  Naam van de categorie
                </label>
                <input
                  ref={inputRef}
                  name="name"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="Bijv. Koelkast temperatuur"
                  className="h-touch-target rounded-lg border border-outline-variant bg-surface px-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant">
                  Omschrijving (optioneel)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  maxLength={200}
                  placeholder="Wat houdt deze taak in?"
                  className="rounded-lg border border-outline-variant bg-surface p-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant">
                  Icoon kiezen
                </label>
                <div className="grid grid-cols-6 gap-sm">
                  {ICON_OPTIONS.map((opt) => {
                    const active = icon === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIcon(opt)}
                        aria-pressed={active}
                        title={opt}
                        className={
                          active
                            ? 'flex h-11 items-center justify-center rounded-lg bg-primary-container text-on-primary-container ring-2 ring-primary'
                            : 'flex h-11 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-high'
                        }
                      >
                        <Icon name={opt} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <SubmitButton />
            </form>
          </div>

          {/* Export */}
          <div className="mt-lg flex items-center justify-between rounded-xl border border-outline-variant bg-surface p-lg">
            <div>
              <h4 className="text-label-md text-on-surface">Data exporteren</h4>
              <p className="text-label-sm font-normal tracking-normal text-secondary">
                Download CSV van alle logs
              </p>
            </div>
            <a
              href="/admin/export"
              title="Download CSV"
              className="flex h-touch-target w-touch-target items-center justify-center rounded-full bg-secondary-container text-on-secondary-container transition-transform active:scale-95"
            >
              <Icon name="download" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
