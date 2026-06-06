// app/admin/_components/AdminClient.tsx
'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  addCategory,
  addPerson,
  deleteCategory,
  deletePerson,
  updateCategoryBarcode,
} from '../actions';
import type { Category, Person } from '@/utils/supabase/types';

type CatAction =
  | { type: 'add'; category: Category }
  | { type: 'delete'; id: string }
  | { type: 'barcode'; id: string; barcode: string | null };

type PersonAction =
  | { type: 'add'; person: Person }
  | { type: 'delete'; id: string };

type Toast = { kind: 'success' | 'error'; message: string } | null;

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

function AddButton({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-touch-target w-full items-center justify-center gap-sm rounded-xl bg-primary text-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon name="add" />
      {pending ? busy : label}
    </button>
  );
}

export function AdminClient({
  initialCategories,
  initialPeople,
}: {
  initialCategories: Category[];
  initialPeople: Person[];
}) {
  const [categories, dispatchCat] = useOptimistic<Category[], CatAction>(
    initialCategories,
    (state, action) => {
      if (action.type === 'add') {
        return [...state, action.category].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
      }
      if (action.type === 'delete') {
        return state.filter((c) => c.id !== action.id);
      }
      if (action.type === 'barcode') {
        return state.map((c) =>
          c.id === action.id ? { ...c, barcode: action.barcode } : c,
        );
      }
      return state;
    },
  );

  const [people, dispatchPerson] = useOptimistic<Person[], PersonAction>(
    initialPeople,
    (state, action) => {
      if (action.type === 'add') {
        return [...state, action.person].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
      }
      if (action.type === 'delete') {
        return state.filter((p) => p.id !== action.id);
      }
      return state;
    },
  );

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<Toast>(null);
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);
  const [editing, setEditing] = useState<string | null>(null); // categorie-id in barcode-bewerkmodus
  const [editValue, setEditValue] = useState('');

  const catFormRef = useRef<HTMLFormElement>(null);
  const catInputRef = useRef<HTMLInputElement>(null);
  const personFormRef = useRef<HTMLFormElement>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    if (t) window.setTimeout(() => setToast(null), 3000);
  };

  // ---- Categorie toevoegen ----
  const handleAddCategory = async (formData: FormData) => {
    const name = (formData.get('name') as string | null)?.trim() ?? '';
    if (!name) {
      showToast({ kind: 'error', message: 'Voer een taaknaam in.' });
      return;
    }
    const description = (formData.get('description') as string | null)?.trim() || null;
    const barcode = (formData.get('barcode') as string | null)?.trim() || null;

    dispatchCat({
      type: 'add',
      category: {
        id: `temp-${crypto.randomUUID()}`,
        name,
        description,
        icon,
        barcode,
        created_at: new Date().toISOString(),
      },
    });
    catFormRef.current?.reset();
    setIcon(ICON_OPTIONS[0]);
    catInputRef.current?.focus();

    const result = await addCategory(formData);
    showToast(
      result.ok
        ? { kind: 'success', message: `"${name}" toegevoegd.` }
        : { kind: 'error', message: result.error },
    );
  };

  const handleDeleteCategory = (category: Category) => {
    if (
      !window.confirm(
        `"${category.name}" verwijderen?\n\nAlle gelogde taken die deze categorie gebruikten worden ook verwijderd.`,
      )
    )
      return;
    startTransition(async () => {
      dispatchCat({ type: 'delete', id: category.id });
      const result = await deleteCategory(category.id);
      showToast(
        result.ok
          ? { kind: 'success', message: `"${category.name}" verwijderd.` }
          : { kind: 'error', message: result.error },
      );
    });
  };

  // ---- Barcode bewerken ----
  const startEdit = (category: Category) => {
    setEditing(category.id);
    setEditValue(category.barcode ?? '');
  };
  const saveBarcode = (category: Category) => {
    const value = editValue.trim();
    setEditing(null);
    startTransition(async () => {
      dispatchCat({ type: 'barcode', id: category.id, barcode: value || null });
      const result = await updateCategoryBarcode(category.id, value);
      showToast(
        result.ok
          ? { kind: 'success', message: `Barcode opgeslagen voor "${category.name}".` }
          : { kind: 'error', message: result.error },
      );
    });
  };

  // ---- Personen ----
  const handleAddPerson = async (formData: FormData) => {
    const name = (formData.get('name') as string | null)?.trim() ?? '';
    if (!name) {
      showToast({ kind: 'error', message: 'Voer een naam in.' });
      return;
    }
    dispatchPerson({
      type: 'add',
      person: {
        id: `temp-${crypto.randomUUID()}`,
        name,
        created_at: new Date().toISOString(),
      },
    });
    personFormRef.current?.reset();

    const result = await addPerson(formData);
    showToast(
      result.ok
        ? { kind: 'success', message: `"${name}" toegevoegd.` }
        : { kind: 'error', message: result.error },
    );
  };

  const handleDeletePerson = (person: Person) => {
    if (!window.confirm(`"${person.name}" uit de lijst verwijderen?`)) return;
    startTransition(async () => {
      dispatchPerson({ type: 'delete', id: person.id });
      const result = await deletePerson(person.id);
      showToast(
        result.ok
          ? { kind: 'success', message: `"${person.name}" verwijderd.` }
          : { kind: 'error', message: result.error },
      );
    });
  };

  const inputCls =
    'h-touch-target rounded-lg border border-outline-variant bg-surface px-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

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
        {/* Taken */}
        <div className="space-y-gutter lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md text-on-surface">Huidige taken</h2>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
              {categories.length} actief
            </span>
          </div>

          {categories.length === 0 ? (
            <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center text-body-md text-secondary">
              Nog geen taken. Voeg er rechts een toe.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              {categories.map((category) => {
                const isOptimistic = category.id.startsWith('temp-');
                const isEditing = editing === category.id;
                return (
                  <div
                    key={category.id}
                    className="group flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-md flex items-start justify-between">
                      <div className="rounded-lg bg-primary-container p-2 text-on-primary-container">
                        <Icon name={category.icon || 'task'} filled />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={isPending || isOptimistic}
                        aria-label={`Verwijder ${category.name}`}
                        className="flex h-touch-target w-touch-target items-center justify-center rounded-full text-error transition-all hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-30 md:opacity-0 md:group-hover:opacity-100"
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

                    {/* Barcode */}
                    <div className="mt-md border-t border-outline-variant pt-md">
                      {isEditing ? (
                        <div className="flex items-center gap-sm">
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveBarcode(category);
                              if (e.key === 'Escape') setEditing(null);
                            }}
                            placeholder="Scan of typ de barcode"
                            className={`${inputCls} h-10 flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => saveBarcode(category)}
                            aria-label="Barcode opslaan"
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary active:scale-95"
                          >
                            <Icon name="check" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          disabled={isOptimistic}
                          className="flex w-full items-center gap-sm text-left text-label-md text-on-surface-variant transition-colors hover:text-primary disabled:opacity-40"
                        >
                          <Icon name="barcode_scanner" />
                          {category.barcode ? (
                            <span className="flex-1 truncate font-mono">
                              {category.barcode}
                            </span>
                          ) : (
                            <span className="flex-1 text-secondary">
                              Barcode toevoegen
                            </span>
                          )}
                          <Icon name="edit" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rechterkolom: toevoegen + personen + export */}
        <div className="space-y-lg lg:col-span-4">
          {/* Taak toevoegen */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm">
            <h2 className="mb-lg text-headline-sm text-on-surface">Taak toevoegen</h2>
            <form ref={catFormRef} action={handleAddCategory} className="space-y-md">
              <input type="hidden" name="icon" value={icon} />

              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant">Naam</label>
                <input
                  ref={catInputRef}
                  name="name"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="Bijv. Koelkast temperatuur"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant">
                  Omschrijving (optioneel)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  maxLength={200}
                  placeholder="Wat houdt deze taak in?"
                  className="rounded-lg border border-outline-variant bg-surface p-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant">
                  Barcode (optioneel)
                </label>
                <input
                  name="barcode"
                  type="text"
                  maxLength={120}
                  placeholder="Scan of typ de barcode"
                  className={`${inputCls} font-mono`}
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant">Icoon</label>
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

              <AddButton label="Taak opslaan" busy="Opslaan…" />
            </form>
          </div>

          {/* Personen */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm">
            <div className="mb-md flex items-center justify-between">
              <h2 className="text-headline-sm text-on-surface">Personen</h2>
              <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
                {people.length}
              </span>
            </div>

            {people.length > 0 && (
              <ul className="mb-md divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface">
                {people.map((person) => {
                  const isOptimistic = person.id.startsWith('temp-');
                  return (
                    <li
                      key={person.id}
                      className="flex items-center justify-between gap-sm px-md py-2"
                    >
                      <span className="flex min-w-0 items-center gap-sm text-body-md text-on-surface">
                        <Icon name="person" />
                        <span className="truncate">{person.name}</span>
                        {isOptimistic && (
                          <span className="text-label-sm text-secondary">…</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePerson(person)}
                        disabled={isPending || isOptimistic}
                        aria-label={`Verwijder ${person.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-error transition-colors hover:bg-error-container disabled:opacity-30"
                      >
                        <Icon name="delete" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <form
              ref={personFormRef}
              action={handleAddPerson}
              className="flex flex-col gap-sm sm:flex-row"
            >
              <input
                name="name"
                type="text"
                required
                maxLength={80}
                placeholder="Naam van de persoon"
                className={`${inputCls} flex-1`}
              />
              <AddButtonInline />
            </form>
          </div>

          {/* Export */}
          <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface p-lg">
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

function AddButtonInline() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-touch-target items-center justify-center gap-sm rounded-xl bg-primary px-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="material-symbols-outlined" aria-hidden>person_add</span>
      {pending ? 'Opslaan…' : 'Toevoegen'}
    </button>
  );
}
