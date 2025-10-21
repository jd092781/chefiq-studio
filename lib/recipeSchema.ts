import { z } from 'zod';

export const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  group: z.string().optional(),
});

export const stepSchema = z.object({
  content: z.string().min(1, 'Step content is required'),
  timerSeconds: z.coerce.number().int().nonnegative().optional(),
  targetTempC: z.coerce.number().nonnegative().optional(),
});

export const recipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  yieldAmount: z.coerce.number().positive().optional(),
  yieldUnit: z.string().optional(),
  activeMinutes: z.coerce.number().int().nonnegative().optional(),
  totalMinutes: z.coerce.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient required'),
  steps: z.array(stepSchema).min(1, 'At least one step required'),
});
