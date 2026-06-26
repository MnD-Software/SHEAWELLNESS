import { z } from "zod";

export const productCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(8),
  price: z.number().nonnegative(),
  inventoryQty: z.number().int().nonnegative(),
  status: z.enum(["active", "draft", "archived", "low_stock"])
});

export const themeLayoutSchema = z.object({
  version: z.literal(1),
  sections: z.array(
    z.object({
      type: z.string(),
      settings: z.record(z.unknown())
    })
  )
});
