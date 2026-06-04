// app/admin/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addCategory(formData: FormData): Promise<ActionResult> {
  const raw = formData.get('name');
  const name = typeof raw === 'string' ? raw.trim() : '';

  if (!name) {
    return { ok: false, error: 'Category name cannot be empty.' };
  }
  if (name.length > 80) {
    return { ok: false, error: 'Category name is too long (max 80 chars).' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('categories').insert({ name });

  if (error) {
    // Postgres unique_violation
    if (error.code === '23505') {
      return { ok: false, error: 'A category with that name already exists.' };
    }
    return { ok: false, error: 'Could not add category. Please try again.' };
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
    return { ok: false, error: 'Could not delete category. Please try again.' };
  }

  revalidatePath('/admin');
  revalidatePath('/log');
  return { ok: true };
}