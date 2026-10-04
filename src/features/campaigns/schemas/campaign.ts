import { z } from 'zod';

export const campaignSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Kampanjnamn måste vara minst 2 tecken')
      .max(100, 'Kampanjnamn får vara max 100 tecken'),
    type: z.enum(['outbound', 'inbound'], { message: 'Välj kampanjtyp' }),
    phoneNumbers: z
      .array(
        z.object({
          name: z.string().min(1, 'Namn krävs'),
          phone: z
            .string()
            .min(5, 'Telefonnummer krävs')
            .regex(/^[\d\s\+\-\(\)]{5,}$/, 'Ogiltigt telefonnummerformat')
        })
      )
      .min(1, 'Minst ett telefonnummer krävs'),
    scheduleStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm'),
    scheduleEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm'),
    scheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD')
  })
  .refine(
    (data) => {
      // If scheduling is provided for outbound, validate minimum 4 hours
      if (data.type === 'outbound' && data.scheduleStartTime && data.scheduleEndTime) {
        const start = data.scheduleStartTime.split(':').map(Number);
        const end = data.scheduleEndTime.split(':').map(Number);
        const startMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];
        const diff = endMinutes - startMinutes;
        return diff >= 240; // 4 hours = 240 minutes
      }
      return true;
    },
    {
      message: 'Utgående kampanjer måste ha minst 4 timmars tidsfönster',
      path: ['scheduleEndTime']
    }
  )
  .refine(
    (data) => {
      // Start time must be before end time
      if (data.scheduleStartTime && data.scheduleEndTime) {
        return data.scheduleStartTime < data.scheduleEndTime;
      }
      return true;
    },
    {
      message: 'Starttid måste vara före sluttid',
      path: ['scheduleEndTime']
    }
  );

export type CampaignFormData = z.infer<typeof campaignSchema>;

export const quickDialSchema = z.object({
  name: z
    .string()
    .min(2, 'Namn måste vara minst 2 tecken')
    .max(100, 'Namn får vara max 100 tecken'),
  phone: z
    .string()
    .min(5, 'Telefonnummer krävs')
    .regex(/^[\d\s\+\-\(\)]{5,}$/, 'Ogiltigt telefonnummerformat'),
  campaignType: z.enum(['outbound', 'inbound']),
  organizationId: z.string().min(1, 'Organisation krävs')
});

export type QuickDialFormData = z.infer<typeof quickDialSchema>;
