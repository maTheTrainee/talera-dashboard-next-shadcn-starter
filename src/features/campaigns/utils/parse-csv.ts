export interface CsvRow {
  first_name: string;
  last_name: string;
  company: string;
  org_number: string;
  email: string;
  phone: string;
}

/**
 * Parsar prospekt-CSV:n (semikolon-separerad — mallens format:
 * first_name;last_name;company;org_number;email;phone). Rader med fel\n * kolumnantal hoppas över; citattecken runt celler rensas.
 */
export function parseProspectCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0]
    .split(';')
    .map((h) => h.trim().toLowerCase());

  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(';').map((c) => c.trim().replace(/^"|"$/g, ''));
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? '';
    });
    if (!record['first_name'] && !record['last_name'] && !record['phone']) continue;
    rows.push({
      first_name: record['first_name'] ?? '',
      last_name: record['last_name'] ?? '',
      company: record['company'] ?? '',
      org_number: record['org_number'] ?? '',
      email: record['email'] ?? '',
      phone: record['phone'] ?? ''
    });
  }
  return rows;
}
