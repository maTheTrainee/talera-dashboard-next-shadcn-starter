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

/** Strict scheduling window: campaigns must span 4–10 hours. */
export const MIN_SCHEDULING_WINDOW_HOURS = 4;
export const MAX_SCHEDULING_WINDOW_HOURS = 10;

/**
 * The dialing window lock: earliest start 08:00, latest end 19:00.
 * n8n enforces the real runtime cutoff — campaigns that reach the wall
 * end early and remaining prospects are saved.
 */
export const DIALING_WINDOW_START = '08:00';
export const DIALING_WINDOW_END = '19:00';

function timeOfDayMinutes(value: string): number | null {
  const timePart = value.split('T')[1];
  if (!timePart) return null;
  const [h, m] = timePart.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Base object schema — exported so step schemas can use .pick(). */
export const campaignBaseSchema = z.object({
  name: z.string().min(2, 'Kampanjnamn måste vara minst 2 tecken'),
  description: z.string().min(5, 'Beskrivningen måste vara minst 5 tecken'),
  scheduled_start: z.string().min(1, 'Starttid krävs'),
  scheduled_end: z.string().min(1, 'Sluttid krävs'),
  outbound_number: z
    .string()
    .refine(
      (value) =>
        value === 'default' ||
        value === '' ||
        /^\+?[0-9\s\-().]{8,20}$/.test(value),
      'Ange ett giltigt telefonnummer (t.ex. 07X eller +467X)'
    )
    .optional(),
  max_attempts: z
    .number({ error: 'Ange ett tal' })
    .min(0, 'Kan inte vara negativt')
    .optional()
});

export const campaignSchema = campaignBaseSchema
  .refine(
    (data) => {
      const startTod = timeOfDayMinutes(data.scheduled_start);
      if (startTod == null) return true;
      return startTod >= 8 * 60; // tidigast 08:00
    },
    { message: 'Kampanjen kan tidigast starta kl 08:00', path: ['scheduled_start'] }
  )
  .refine(
    (data) => {
      const endTod = timeOfDayMinutes(data.scheduled_end);
      if (endTod == null) return true;
      return endTod <= 19 * 60; // senast 19:00
    },
    { message: 'Kampanjen får avslutas senast kl 19:00', path: ['scheduled_end'] }
  )
  .refine(
    (data) => {
      const start = new Date(data.scheduled_start);
      const end = new Date(data.scheduled_end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      return start.toDateString() === end.toDateString();
    },
    { message: 'Kampanjen måste vara inom samma dag', path: ['scheduled_end'] }
  )
  .refine(
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
  )
  .refine(
    (data) => {
      const start = new Date(data.scheduled_start).getTime();
      const end = new Date(data.scheduled_end).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return end - start <= MAX_SCHEDULING_WINDOW_HOURS * 60 * 60 * 1000;
    },
    {
      message: `Schemaläggningsfönstret får vara max ${MAX_SCHEDULING_WINDOW_HOURS} timmar`,
      path: ['scheduled_end']
    }
  );

export type CampaignFormValues = z.infer<typeof campaignSchema>;