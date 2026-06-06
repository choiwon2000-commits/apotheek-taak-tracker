// app/admin/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_DESCRIPTION = 200;

export async function addCategory(formData: FormData): Promise<ActionResult> {
  const raw = formData.get('name');
  const name = typeof raw === 'string' ? raw.trim() : '';

  const descRaw = formData.get('description');
  const description =
    typeof descRaw === 'string' && descRaw.trim() ? descRaw.trim() : null;

  const iconRaw = formData.get('icon');
  const icon = typeof iconRaw === 'string' && iconRaw.trim() ? iconRaw.trim() : null;

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
    .insert({ name, description, icon });

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