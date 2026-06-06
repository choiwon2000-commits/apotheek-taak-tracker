// app/login/_components/LoginForm.tsx
'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { login, type LoginState } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-touch-target w-full items-center justify-center gap-sm rounded-lg bg-primary-container text-label-md text-on-primary-container shadow-sm transition-all duration-100 hover:bg-primary hover:text-on-primary active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
    >
      {pending ? (
        <>
          <span className="material-symbols-outlined animate-spin" aria-hidden>
            progress_activity
          </span>
          Bezig met verifiëren…
        </>
      ) : (
        <>
          <span className="material-symbols-outlined filled" aria-hidden>
            login
          </span>
          Inloggen
        </>
      )}
    </button>
  );
}

export function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, null);
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-lg">
      <input type="hidden" name="from" value={from} />

      {state?.error && (
        <div
          role="alert"
          className="flex items-center gap-sm rounded-lg border border-error/30 bg-error-container px-md py-3 text-label-md text-on-error-container"
        >
          <span className="material-symbols-outlined" aria-hidden>
            error
          </span>
          {state.error}
        </div>
      )}

      <div className="space-y-sm">
        <label
          htmlFor="password"
          className="block px-xs text-label-md text-on-surface-variant"
        >
          Inlogcode
        </label>
        <div className="group relative w-full min-w-0">
          <span
            className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
            aria-hidden
          >
            lock
          </span>
          <input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            required
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-touch-target w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-low pl-12 pr-12 text-body-md text-on-surface transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            title={show ? 'Verberg code' : 'Toon code'}
            className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-outline transition-colors hover:text-on-surface-variant"
          >
            <span className="material-symbols-outlined" aria-hidden>
              {show ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
