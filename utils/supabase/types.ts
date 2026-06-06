// utils/supabase/types.ts
export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;        // Material Symbol naam, bijv. 'medication'
  created_at: string;
};

export type Task = {
  id: string;
  date: string;            // ISO 'YYYY-MM-DD'
  category_id: string;
  details: string | null;
  logged_by: string | null; // optionele naam/initialen van wie logde
  created_at: string;
};

// Used on the calendar — task row joined with its category name.
export type TaskWithCategory = Task & {
  category: Pick<Category, 'id' | 'name' | 'icon'>;
};
