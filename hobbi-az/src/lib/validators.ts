import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ad ən azı 2 simvol olmalıdır").max(60),
  email: z.string().trim().toLowerCase().email("E-poçt düzgün deyil").max(254),
  password: z
    .string()
    .min(8, "Şifrə ən azı 8 simvol olmalıdır")
    .max(128)
    .regex(/[A-Za-z]/, "Şifrədə hərf olmalıdır")
    .regex(/[0-9]/, "Şifrədə rəqəm olmalıdır"),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-poçt düzgün deyil"),
  password: z.string().min(1, "Şifrəni daxil edin").max(128),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(30).optional().nullable(),
  city: z.string().trim().max(60).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
});

const imageKey = z.string().regex(/^[a-f0-9]{32}\.(jpg|png|webp)$/, "Şəkil açarı yanlışdır");

export const listingSchema = z.object({
  title: z.string().trim().min(3, "Başlıq ən azı 3 simvol olmalıdır").max(120),
  description: z.string().trim().min(10, "Təsvir ən azı 10 simvol olmalıdır").max(5000),
  priceAzn: z.coerce.number().min(0, "Qiymət mənfi ola bilməz").max(1_000_000),
  categorySlug: z.string().min(1, "Kateqoriya seçin"),
  condition: z.enum(["NEW", "USED", "HANDMADE"]).default("NEW"),
  city: z.string().trim().min(2, "Şəhər daxil edin").max(60),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  images: z.array(imageKey).max(8).default([]),
});
export const listingUpdateSchema = listingSchema.partial();

export const reportSchema = z.object({
  listingId: z.string().min(1),
  reason: z.enum(["SPAM", "FRAUD", "PROHIBITED", "OFFENSIVE", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

export const moderationSchema = z.object({
  action: z.enum(["remove", "restore"]),
  reason: z.string().trim().max(500).optional(),
});

export const newConversationSchema = z.object({
  recipientId: z.string().min(1),
  listingId: z.string().min(1).optional(),
  body: z.string().trim().min(1).max(2000),
});
export const messageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(500) });

export const listingQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(60).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  sort: z.enum(["new", "price_asc", "price_desc"]).default("new"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
