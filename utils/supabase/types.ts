// utils/supabase/types.ts
export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;        // Material Symbol naam, bijv. 'medication'
  barcode: string | null;     // Code 128-waarde voor scannen
  created_at: string;
};

export type Person = {
  id: string;
  name: string;
  created_at: string;
};

export type Task = {
  id: string;
  date: string;            // ISO 'YYYY-MM-DD'
  category_id: string;
  details: string | null;
  logged_by: string | null; // naam van de gekozen persoon
  created_at: string;
};

// Used on the calendar — task row joined with its category name.
export type TaskWithCategory = Task & {
  category: Pick<Category, 'id' | 'name' | 'icon'>;
};
