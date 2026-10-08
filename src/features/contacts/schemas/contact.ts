import * as z from 'zod';

/**
 * Automated phone number cleaning (07X ➔ +467X) — applied on submit so every
 * stored prospect number is E.164 dial-ready.
 */
export function normalizeProspectPhone(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('07')) return `+46${digits.slice(1)}`;
  if (digits.startsWith('46')) return `+${digits}`;
  return digits;
}

export const contactSchema = z
  .object({
    first_name: z.string().min(2, 'Förnamn måste vara minst 2 tecken'),
    last_name: z.string().min(2, 'Efternamn måste vara minst 2 tecken'),
    email: z.email('Ange en giltig e-postadress').or(z.literal('')),
    phone: z
      .string()
      .min(8, 'Telefonnummer krävs')
      .refine(
        (value) => /^\+?[0-9\s\-().]{8,20}$/.test(value),
        'Ange ett giltigt telefonnummer (t.ex. 07X eller +467X)'
      ),
    status: z.string().min(1, 'Välj en status'),
    follow_up_at: z.string().optional()
  })
  .refine(
    (data) =>
      data.status !== 'uppföljning' ||
      (!!data.follow_up_at && data.follow_up_at.length > 0),
    {
      message: 'Ange datum och tid för uppföljningen',
      path: ['follow_up_at']
    }
  );

export type ContactFormValues = z.infer<typeof contactSchema>;
