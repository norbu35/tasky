import { z } from "zod";

export const createTaskSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  description: z.string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description cannot exceed 2000 characters"),
  budget: z.number().int().min(5000, "Minimum budget is 5,000 MNT").max(10000000, "Budget cannot exceed 10,000,000 MNT"),
  scheduled_at: z.string().min(1, "Schedule time is required"),
  location_text: z.string()
      .min(5, "Address must be at least 5 characters")
      .max(200, "Address cannot exceed 200 characters"),
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  photo_keys: z.array(z.string()).max(3, "Cannot upload more than 3 photos").optional(),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
