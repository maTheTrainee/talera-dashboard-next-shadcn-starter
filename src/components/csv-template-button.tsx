'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

/**
 * "Ladda ner CSV-mall" — downloads the prospect import template (Swedish
 * Excel-style `;` separator). The uploaded CSV is consumed by the campaign
 * wizard's dropzone step (preserved stepper/dropzone atoms).
 */
const CSV_TEMPLATE = [
  'first_name;last_name;company;org_number;email;phone',
  'Anna;Andersson;Acme AB;556123-4567;anna@acme.se;0701234567',
  'Erik;Svensson;Nordica AB;556987-1234;erik@nordica.se;0739876543'
].join('\n');

export function CsvTemplateButton() {
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'talera-kontaktmall.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant='outline' onClick={downloadTemplate}>
      <Icons.download className='mr-2 h-4 w-4' /> Ladda ner CSV-mall
    </Button>
  );
}