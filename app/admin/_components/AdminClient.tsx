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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Adding…' : 'Add category'}
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
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    if (t) window.setTimeout(() => setToast(null), 3000);
  };

  // Form action — React runs this inside a transition automatically,
  // so dispatchOptimistic works here without an explicit startTransition.
  const handleAdd = async (formData: FormData) => {
    const raw = formData.get('name');
    const name = typeof raw === 'string' ? raw.trim() : '';
    if (!name) {
      showToast({ kind: 'error', message: 'Please enter a category name.' });
      return;
    }

    dispatchOptimistic({
      type: 'add',
      category: {
        id: `temp-${crypto.randomUUID()}`,
        name,
        created_at: new Date().toISOString(),
      },
    });
    formRef.current?.reset();
    inputRef.current?.focus();

    const result = await addCategory(formData);
    if (result.ok) {
      showToast({ kind: 'success', message: `Added "${name}".` });
    } else {
      showToast({ kind: 'error', message: result.error });
    }
  };

  const handleDelete = (category: Category) => {
    if (
      !window.confirm(
        `Delete "${category.name}"?\n\nAny logged tasks using this category will also be removed.`,
      )
    ) {
      return;
    }

    startDeleteTransition(async () => {
      dispatchOptimistic({ type: 'delete', id: category.id });
      const result = await deleteCategory(category.id);
      if (result.ok) {
        showToast({ kind: 'success', message: `Deleted "${category.name}".` });
      } else {
        showToast({ kind: 'error', message: result.error });
      }
    });
  };

  return (
    <div className="space-y-6">
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

      {/* Add form */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Add new category
        </h2>
        <form
          ref={formRef}
          action={handleAdd}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            ref={inputRef}
            name="name"
            type="text"
            placeholder="e.g. Koelkast temperatuur"
            maxLength={80}
            required
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
          <SubmitButton />
        </form>
      </section>

      {/* Existing categories */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Existing categories
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {optimisticCategories.length} total
          </span>
        </header>

        {optimisticCategories.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No categories yet. Add your first one above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {optimisticCategories.map((category) => {
              const isOptimistic = category.id.startsWith('temp-');
              return (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <span
                    className={
                      isOptimistic
                        ? 'text-sm text-slate-400'
                        : 'text-sm text-slate-800'
                    }
                  >
                    {category.name}
                    {isOptimistic && (
                      <span className="ml-2 text-xs text-slate-400">
                        saving…
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={isDeleting || isOptimistic}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}