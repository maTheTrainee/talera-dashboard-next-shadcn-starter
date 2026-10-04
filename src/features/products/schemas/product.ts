import * as z from 'zod';

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const productSchema = z.object({
  image: z
    .array(z.instanceof(File))
    .optional()
    .refine((files) => !files || files.length === 1, 'Image is required.')
    .refine((files) => !files || files[0]?.size <= MAX_FILE_SIZE, 'Max file size is 5MB.')
    .refine(
      (files) => !files || ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number({
    required_error: 'Price is required',
    invalid_type_error: 'Price must be a number'
  }),
  description: z.string().min(10, 'Description must be at least 10 characters.')
});

export type ProductFormValues = z.infer<typeof productSchema>;
