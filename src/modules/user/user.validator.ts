import { z } from "zod";

export const CreateUserSchema = z.object({
  first_name: z.string().trim().min(2, 'First name is required'),
  last_name: z.string().trim().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"), 
  phone_number: z.string().min(5, "Phone number is required"),
  password: z.string().min(8, "Minimum of 8 characters required for security")
});
