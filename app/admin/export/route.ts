// app/admin/export/route.ts
// Downloadt alle gelogde taken als CSV-bestand. Beveiligd via proxy.ts.
import { createClient } from '@/utils/supabase/server';

type Row = {
  date: string;
  details: string | null;
  logged_by: string | null;
  created_at: string;
  category: { name: string } | null;
};

// Zet een waarde veilig om naar een CSV-veld (komma's/aanhalingstekens/regeleindes).
function csvField(value: string): string {
  const v = value ?? '';
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function timeLabel(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('date, details, logged_by, created_at, category:categories(name)')
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return new Response('Kon export niet maken.', { status: 500 });
  }

  const rows = (data ?? []) as unknown as Row[];
  const header = ['Datum', 'Tijd', 'Categorie', 'Details', 'Gelogd door'];
  const lines = [header.join(',')];

  for (const r of rows) {
    lines.push(
      [
        csvField(r.date),
        csvField(timeLabel(r.created_at)),
        csvField(r.category?.name ?? ''),
        csvField(r.details ?? ''),
        csvField(r.logged_by ?? ''),
      ].join(','),
    );
  }

  // BOM zodat Excel UTF-8 correct toont.
  const csv = '﻿' + lines.join('\r\n');
  const filename = `apotheek-marne-logs-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
