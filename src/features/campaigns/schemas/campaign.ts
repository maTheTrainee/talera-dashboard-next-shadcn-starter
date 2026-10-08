import * as z from 'zod';

/**
 * Automated phone number cleaning (07X ➔ +467X).
 * Strips spaces, dashes, parentheses and dots; prefixes Swedish country code.
 */
export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('07')) return `+46${digits.slice(1)}`;
  if (digits.startsWith('46')) return `+${digits}`;
  return digits;
}

/** Strict scheduling window: campaigns must span at least 4 hours. */
export const MIN_SCHEDULING_WINDOW_HOURS = 4;

/** Base object schema — exported so step schemas can use .pick(). */
export const campaignBaseSchema = z.object({
  name: z.string().min(2, 'Kampanjnamn måste vara minst 2 tecken'),
  description: z.string().min(5, 'Beskrivningen måste vara minst 5 tecken'),
  scheduled_start: z.string().min(1, 'Starttid krävs'),
  scheduled_end: z.string().min(1, 'Sluttid krävs'),
  uv_agent_id: z.string().min(1, 'Välj en röstagent'),
  outbound_number: z
    .string()
    .min(8, 'Utgående nummer krävs')
    .refine(
      (value) => /^\+?[0-9\s\-().]{8,20}$/.test(value),
      'Ange ett giltigt telefonnummer (t.ex. 07X eller +467X)'
    )
});

export const campaignSchema = campaignBaseSchema.refine(
  (data) => {
    const start = new Date(data.scheduled_start).getTime();
    const end = new Date(data.scheduled_end).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    return end - start >= MIN_SCHEDULING_WINDOW_HOURS * 60 * 60 * 1000;
  },
  {
    message: `Schemaläggningsfönstret måste vara minst ${MIN_SCHEDULING_WINDOW_HOURS} timmar`,
    path: ['scheduled_end']
  }
);

export type CampaignFormValues = z.infer<typeof campaignSchema>;