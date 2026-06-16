export function escapeCsvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(
  rows: Record<string, unknown>[],
  columns: Array<{ key: string; label: string }>
): string {
  const header = columns.map((col) => escapeCsvCell(col.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(row[col.key])).join(",")
  );
  return `\uFEFF${[header, ...lines].join("\n")}`;
}
