import * as XLSX from 'xlsx';
import { apiClient } from '@/lib/apiClient';

export const REQUIRED_COLUMNS = [
  'First Name', 'Last Name', 'Phone Number', 'Full Address', 'City', 'Province / State', 'Amount Owed', 'Days Overdue',
];

export interface ParsedRow {
  rowIndex: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  province: string;
  postal: string | null;
  amount: number;
  loanDate: string | null;
  daysOverdue: number;
  loanType: string;
  notes: string | null;
  valid: boolean;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: { row: number; errors: string[] }[];
  totalCount: number;
  validCount: number;
  errorCount: number;
}

function normalizePhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

export async function parseImportFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, any>[];

        const errors: { row: number; errors: string[] }[] = [];
        const cleaned: ParsedRow[] = rows.map((row, i) => {
          const rowErrors: string[] = [];

          if (!row['First Name']?.toString().trim()) rowErrors.push('Missing First Name');
          if (!row['Last Name']?.toString().trim()) rowErrors.push('Missing Last Name');
          if (!row['Phone Number']?.toString().trim()) rowErrors.push('Missing Phone Number');
          if (!row['Amount Owed'] || isNaN(Number(row['Amount Owed']))) rowErrors.push('Invalid Amount Owed');
          if (!row['Days Overdue'] || isNaN(Number(row['Days Overdue']))) rowErrors.push('Invalid Days Overdue');

          const phone = row['Phone Number']?.toString().replace(/\D/g, '');
          if (phone && phone.length < 10) rowErrors.push('Phone number too short');

          const cleanRow: ParsedRow = {
            rowIndex: i + 2,
            firstName: row['First Name']?.toString().trim() || '',
            lastName: row['Last Name']?.toString().trim() || '',
            fullName: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
            phone: normalizePhone(row['Phone Number']?.toString() || ''),
            email: row['Email Address']?.toString().trim() || null,
            address: row['Full Address']?.toString().trim() || '',
            city: row['City']?.toString().trim() || '',
            province: row['Province / State']?.toString().trim() || '',
            postal: row['Postal / Zip Code']?.toString().trim() || null,
            amount: parseFloat(row['Amount Owed']) || 0,
            loanDate: row['Original Loan Date']?.toString().trim() || null,
            daysOverdue: parseInt(row['Days Overdue']) || 0,
            loanType: row['Loan Type']?.toString().trim() || 'Personal',
            notes: row['Notes']?.toString().trim() || null,
            valid: rowErrors.length === 0,
            errors: rowErrors,
          };

          if (rowErrors.length > 0) errors.push({ row: i + 2, errors: rowErrors });
          return cleanRow;
        });

        resolve({
          rows: cleaned,
          errors,
          totalCount: cleaned.length,
          validCount: cleaned.filter(r => r.valid).length,
          errorCount: errors.length,
        });
      } catch {
        reject(new Error('Could not read file. Please use the provided template.'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function processImport({ rows, companyId }: { rows: ParsedRow[]; companyId?: string }) {
  const validRows = rows.filter(r => r.valid);
  return apiClient.post('/import/process', { accounts: validRows, companyId });
}

export async function getImportProgress({ importId }: { importId: string }) {
  return apiClient.get(`/import/progress/${importId}`);
}

export function downloadTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const headers = [
    'First Name', 'Last Name', 'Phone Number', 'Email Address',
    'Full Address', 'City', 'Province / State', 'Postal / Zip Code',
    'Amount Owed', 'Original Loan Date', 'Days Overdue', 'Loan Type', 'Notes'
  ];
  const example = [
    'Marcus', 'Allen', '+15552104400', 'marcus@email.com',
    '123 Main Street', 'Montreal', 'QC', 'H2X 1Y4',
    '850', '2024-12-01', '45', 'Payday', ''
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Accounts');
  XLSX.writeFile(wb, `kollection_import_template.${format}`);
}
