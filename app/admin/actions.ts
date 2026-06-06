// app/admin/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { isAuthenticated } from '@/utils/auth-guard';

export type ActionResult = { ok: true } | { ok: false; error: string };

const NOT_AUTHED: ActionResult = {
  ok: false,
  error: 'Niet ingelogd. Herlaad de pagina en log opnieuw in.',
};

const MAX_DESCRIPTION = 200;

export async function addCategory(formData: FormData): Promise<ActionResult> {
  if (!(await isAuthenticated())) return NOT_AUTHED;

  const raw = formData.get('name');
  const name = typeof raw === 'string' ? raw.trim() : '';

  const descRaw = formData.get('description');
  const description =
    typeof descRaw === 'string' && descRaw.trim() ? descRaw.trim() : null;

  const iconRaw = formData.get('icon');
  const icon = typeof iconRaw === 'string' && iconRaw.trim() ? iconRaw.trim() : null;

  const barcodeRaw = formData.get('barcode');
  const barcode =
    typeof barcodeRaw === 'string' && barcodeRaw.trim() ? barcodeRaw.trim() : null;

  if (!name) {
    return { ok: false, error: 'Naam van de categorie mag niet leeg zijn.' };
  }
  if (name.length > 80) {
    return { ok: false, error: 'Naam is te lang (max. 80 tekens).' };
  }
  if (description && description.length > MAX_DESCRIPTION) {
    return {
      ok: false,
      error: `Omschrijving is te lang (max. ${MAX_DESCRIPTION} tekens).`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .insert({ name, description, icon, barcode });

  if (error) {
    // Postgres unique_violation
    if (error.code === '23505') {
      return { ok: false, error: 'Er bestaat al een categorie met die naam.' };
    }
    return {
      ok: false,
      error: 'Categorie kon niet worden toegevoegd. Probeer het opnieuw.',
    };
  }

  // Refresh both pages that depend on this data.
  revalidatePath('/admin');
  revalidatePath('/log');
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!(await isAuthenticated())) return NOT_AUTHED;
  if (!id) return { ok: false, error: 'Missing category ID.' };

  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    return {
      ok: false,
      error: 'Categorie kon niet worden verwijderd. Probeer het opnieuw.',
    };
  }

  revalidatePath('/admin');
  revalidatePath('/log');
  return { ok: true };
}

// De barcode (Code 128-waarde) van een bestaande taak instellen of wijzigen.
export async function updateCategoryBarcode(
  id: string,
  barcode: string,
): Promise<ActionResult> {
  if (!(await isAuthenticated())) return NOT_AUTHED;
  if (!id) return { ok: false, error: 'Ontbrekende categorie-ID.' };

  const value = barcode.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .update({ barcode: value })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Die barcode is al aan een andere taak gekoppeld.' };
    }
    return {
      ok: false,
      error: 'Barcode kon niet worden opgeslagen. Probeer het opnieuw.',
    };
  }

  revalidatePath('/admin');
  revalidatePath('/log');
  return { ok: true };
}

// ---------- Personen ----------
export async function addPerson(formData: FormData): Promise<ActionResult> {
  if (!(await isAuthenticated())) return NOT_AUTHED;

  const raw = formData.get('name');
  const name = typeof raw === 'string' ? raw.trim() : '';

  if (!name) return { ok: false, error: 'Naam mag niet leeg zijn.' };
  if (name.length > 80) {
    return { ok: false, error: 'Naam is te lang (max. 80 tekens).' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('people').insert({ name });

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Die persoon staat al in de lijst.' };
    }
    return {
      ok: false,
      error: 'Persoon kon niet worden toegevoegd. Probeer het opnieuw.',
    };
  }

  revalidatePath('/admin');
  revalidatePath('/log');
  return { ok: true };
}

export async function deletePerson(id: string): Promise<ActionResult> {
  if (!(await isAuthenticated())) return NOT_AUTHED;
  if (!id) return { ok: false, error: 'Ontbrekende persoon-ID.' };

  const supabase = await createClient();
  const { error } = await supabase.from('people').delete().eq('id', id);

  if (error) {
    return {
      ok: false,
      error: 'Persoon kon niet worden verwijderd. Probeer het opnieuw.',
    };
  }

  revalidatePath('/admin');
  revalidatePath('/log');
  return { ok: true };
}