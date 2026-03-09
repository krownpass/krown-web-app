import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(10, "Enter a valid 10-digit number")
  .max(10, "Enter a valid 10-digit number")
  .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number");

export const otpSchema = z
  .string()
  .length(6, "OTP must be 6 digits")
  .regex(/^\d{6}$/, "OTP must contain only digits");

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  email: z.string().email("Enter a valid email address"),
  phone: phoneSchema,
  referral_code: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  email: z.string().email("Enter a valid email address"),
});

export const bookingSchema = z.object({
  cafe_id: z.string().min(1),
  booking_type: z.enum(["standard", "priority"]),
  date: z.string().min(1, "Select a date"),
  time_slot: z.string().min(1, "Select a time slot"),
  guest_count: z.number().min(1, "At least 1 guest required").max(20, "Maximum 20 guests"),
  special_requests: z.string().max(500, "Too long").optional(),
});

export const reviewSchema = z.object({
  rating: z.number().min(1, "Rate at least 1 star").max(5, "Maximum 5 stars"),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(500, "Too long"),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
