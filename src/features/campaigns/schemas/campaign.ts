import { z } from 'zod';

export const campaignSchema = z.object({
  name: z
    .string()
    .min(2, 'Kampanjnamn måste vara minst 2 tecken')
    .max(100, 'Kampanjnamn får vara max 100 tecken'),
  type: z.enum(['outbound', 'inbound']).refine(() => true, { message: 'Välj kampanjtyp' }),
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
    .min(1, 'Minst ett telefonnummer krävs')
});

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
