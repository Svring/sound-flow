import { z } from "zod";

/**
 * GPT-SoVits Control Request Schema
 * Used for /control endpoint to restart or exit the service
 */
export const gsControlRequestSchema = z.object({
  command: z.enum(["restart", "exit"])
})

/**
 * Type derived from the schema
 */
export type GsControlRequest = z.infer<typeof gsControlRequestSchema>

/**
 * Validation function for control requests
 */
export function validateControlRequest(data: unknown): { success: boolean; data?: GsControlRequest; error?: string } {
  try {
    const validatedData = gsControlRequestSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') 
      }
    }
    return { success: false, error: 'Validation failed' }
  }
} 