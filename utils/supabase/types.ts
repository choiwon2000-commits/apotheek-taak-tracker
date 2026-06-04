// utils/supabase/types.ts
export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type Task = {
  id: string;
  date: string;            // ISO 'YYYY-MM-DD'
  category_id: string;
  details: string | null;
  created_at: string;
};

// Used on the calendar — task row joined with its category name.
export type TaskWithCategory = Task & {
  category: Pick<Category, 'id' | 'name'>;
};